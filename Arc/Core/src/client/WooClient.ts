import { isWooError, withRetry } from '../http';
import { ArcClientError, ArcNetworkError, ArcParseError, type ArcError } from '../types/errors.js';
import type { WooApiError, WooCart, WooClientOptions, WooRequestOptions } from '../types/woo';

/** Base path for all WC Store API v1 endpoints. */
const STORE_API_PATH = '/wp-json/wc/store/v1';

/** Header name WC uses to pass the session Cart-Token. */
const CART_TOKEN_HEADER = 'Cart-Token';

/** Header name WC uses to pass the session Store-API Nonce. */
const NONCE_HEADER = 'Nonce';

/** Default request timeout (10 seconds). */
const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * A typed error thrown when the WC Store API returns a structured error response.
 * Carries the HTTP status code so `withRetry` can decide whether to retry, and
 * exposes a normalized {@link ArcError} via `.arcError` (ARC-API-03).
 */
export class WooClientError extends ArcClientError {
  readonly code: string;
  readonly status: number;
  readonly data: WooApiError['data'];

  constructor(apiError: WooApiError) {
    super(apiError.message);
    this.name = 'WooClientError';
    this.code = apiError.code;
    this.status = apiError.data.status;
    this.data = apiError.data;
  }

  /** Normalized error descriptor for exhaustive matching (ARC-API-03). */
  get arcError(): Extract<ArcError, { type: 'api' }> {
    return {
      type: 'api',
      status: this.status,
      code: this.code,
      message: this.message,
      data: this.data,
    };
  }
}

/**
 * Framework-agnostic WooCommerce Store API v1 client.
 *
 * Handles:
 * - Cart-Token session management (extracts from response header, injects on requests)
 * - Nonce refresh on `rest_cookie_invalid_nonce` + single retry
 * - Exponential backoff on 5xx responses (max 3 attempts)
 * - AbortSignal timeout (default 10 s, configurable)
 *
 * Does NOT set cookies — that is the responsibility of the framework layer
 * (`@arc/next`) via the `onCartToken` callback.
 */
export class WooClient {
  private readonly baseUrl: string;
  private readonly options: Required<
    Pick<WooClientOptions, 'timeout'> &
      Pick<WooClientOptions, 'onCartToken' | 'getCartToken' | 'getNonce' | 'onNonce'>
  >;

  /**
   * Session captured from responses on THIS instance. The WC Store API issues a
   * Cart-Token (and a Nonce) on each response; replaying them on subsequent
   * requests makes a single client session-sticky — so a write (add-item, etc.)
   * after an initial read is authenticated even without external persistence
   * callbacks. `getCartToken`/`getNonce` (cookie-backed) still take precedence.
   */
  private _cartToken?: string;
  private _nonce?: string;

  constructor(opts: WooClientOptions) {
    // Normalize trailing slash
    this.baseUrl = opts.baseUrl.replace(/\/+$/, '');
    this.options = {
      timeout: opts.timeout ?? DEFAULT_TIMEOUT_MS,
      onCartToken: opts.onCartToken ?? (() => undefined),
      getCartToken: opts.getCartToken ?? (() => null),
      getNonce: opts.getNonce ?? (() => null),
      onNonce: opts.onNonce ?? (() => undefined),
    };
  }

  // ---------------------------------------------------------------------------
  // Core request method
  // ---------------------------------------------------------------------------

  /**
   * Makes a typed fetch request to the WC Store API.
   *
   * - Injects Cart-Token header if one is available
   * - Extracts Cart-Token from the response header, fires `onCartToken` on change
   * - On `rest_cookie_invalid_nonce`: refreshes nonce via `getNonce()`, retries once
   * - On 5xx: delegates to `withRetry` (exponential backoff, max 3 attempts)
   */
  async request<T>(path: string, init: RequestInit & WooRequestOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${STORE_API_PATH}${path}`;
    const { signal: externalSignal, nonce: perRequestNonce, ...fetchInit } = init;
    const method = (fetchInit.method ?? 'GET').toUpperCase();

    if (method !== 'GET' && method !== 'HEAD') {
      await this.ensureCartSessionBeforeMutation(perRequestNonce);
    }

    const makeRequest = async (currentNonce?: string): Promise<T> => {
      // Build AbortSignal: combine external signal with timeout
      const timeoutController = new AbortController();
      const timeoutId = setTimeout(
        () =>
          timeoutController.abort(
            new Error(`WooClient request timed out after ${this.options.timeout}ms`),
          ),
        this.options.timeout,
      );

      let combinedSignal: AbortSignal;
      if (externalSignal) {
        combinedSignal = AbortSignal.any
          ? AbortSignal.any([externalSignal, timeoutController.signal])
          : timeoutController.signal;
      } else {
        combinedSignal = timeoutController.signal;
      }

      // Build headers
      const headers = new Headers(fetchInit.headers);
      headers.set('Content-Type', 'application/json');
      headers.set('Accept', 'application/json');

      // Prefer the persistence callback (cookie-backed); fall back to the
      // token captured from a prior response on this instance.
      const cartToken = this.options.getCartToken() ?? this._cartToken ?? null;
      if (cartToken) {
        headers.set(CART_TOKEN_HEADER, cartToken);
      }

      if (currentNonce) {
        // WC accepts the nonce under `Nonce`; keep the legacy header too.
        headers.set(NONCE_HEADER, currentNonce);
        headers.set('X-WC-Store-API-Nonce', currentNonce);
      }

      let response: Response;
      try {
        response = await fetch(url, {
          ...fetchInit,
          headers,
          signal: combinedSignal,
        });
      } catch (err) {
        // fetch rejects before any response: network failure, DNS, reset,
        // timeout abort, or external-signal abort. Normalize to ArcNetworkError.
        const reason =
          combinedSignal.aborted && combinedSignal.reason instanceof Error
            ? combinedSignal.reason.message
            : err instanceof Error
              ? err.message
              : 'Network request failed';
        throw new ArcNetworkError(reason, err);
      } finally {
        clearTimeout(timeoutId);
      }

      // Capture Cart-Token from the response: store on this instance for replay,
      // and notify the persistence layer only when it actually changed.
      const receivedToken = response.headers.get(CART_TOKEN_HEADER);
      if (receivedToken) {
        this._cartToken = receivedToken;
        if (receivedToken !== cartToken) {
          await this.options.onCartToken(receivedToken);
        }
      }

      // Capture the Nonce header the same way (WC requires it for some writes).
      const receivedNonce = response.headers.get(NONCE_HEADER);
      if (receivedNonce) {
        const nonceChanged = receivedNonce !== this._nonce;
        this._nonce = receivedNonce;
        if (nonceChanged) {
          this.options.onNonce(receivedNonce);
        }
      }

      // Parse response body
      let body: unknown;
      const contentType = response.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        try {
          body = await response.json();
        } catch (err) {
          throw new ArcParseError(
            `Failed to parse JSON response body (HTTP ${response.status})`,
            err,
          );
        }
      } else {
        body = await response.text();
      }

      // Handle error responses
      if (!response.ok) {
        if (isWooError(body)) {
          throw new WooClientError(body);
        }
        throw new WooClientError({
          code: `http_${response.status}`,
          message: `HTTP ${response.status} ${response.statusText}`,
          data: { status: response.status },
        });
      }

      return body as T;
    };

    // Nonce-retry wrapper: on rest_cookie_invalid_nonce, refresh and retry once
    const withNonceRetry = async (): Promise<T> => {
      const initialNonce =
        perRequestNonce ?? (await this.options.getNonce()) ?? this._nonce ?? undefined;
      try {
        return await makeRequest(initialNonce as string | undefined);
      } catch (err) {
        if (err instanceof WooClientError && err.code === 'rest_cookie_invalid_nonce') {
          const freshNonce = await this.options.getNonce();
          if (freshNonce) {
            this.options.onNonce(freshNonce);
            return makeRequest(freshNonce);
          }
        }
        throw err;
      }
    };

    // 5xx retry wrapper
    return withRetry(withNonceRetry, { maxAttempts: 3, baseDelay: 1000 });
  }

  // ---------------------------------------------------------------------------
  // Cart operations
  // ---------------------------------------------------------------------------

  /**
   * WC Store API writes require a session (Cart-Token + Nonce). Fresh client
   * instances — e.g. a new Server Action — may have a persisted token but no
   * in-memory nonce. Bootstrap with GET /cart before the first mutation.
   */
  private async ensureCartSessionBeforeMutation(explicitNonce?: string): Promise<void> {
    const token = this.options.getCartToken() ?? this._cartToken ?? null;
    const nonce = explicitNonce ?? this._nonce ?? (await this.options.getNonce()) ?? null;
    if (token && nonce) return;

    await this.getCart();
  }

  /** Fetch the current cart. First call returns a Cart-Token via `onCartToken`. */
  getCart(): Promise<WooCart> {
    return this.request<WooCart>('/cart');
  }

  /** Add a product to the cart. */
  addToCart(productId: number, quantity: number): Promise<WooCart> {
    return this.request<WooCart>('/cart/add-item', {
      method: 'POST',
      body: JSON.stringify({ id: productId, quantity }),
    });
  }

  /** Update the quantity of a cart line item by key. */
  updateCartItem(key: string, quantity: number): Promise<WooCart> {
    return this.request<WooCart>('/cart/update-item', {
      method: 'POST',
      body: JSON.stringify({ key, quantity }),
    });
  }

  /** Remove a cart line item by key. */
  removeCartItem(key: string): Promise<WooCart> {
    return this.request<WooCart>('/cart/remove-item', {
      method: 'DELETE',
      body: JSON.stringify({ key }),
    });
  }

  /** Apply a coupon code to the cart. WC Store API v1: `POST /cart/coupons`. */
  applyCoupon(code: string): Promise<WooCart> {
    return this.request<WooCart>('/cart/coupons', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  /** Remove a coupon code from the cart. WC Store API v1: `DELETE /cart/coupons/{code}`. */
  removeCoupon(code: string): Promise<WooCart> {
    return this.request<WooCart>(`/cart/coupons/${encodeURIComponent(code)}`, {
      method: 'DELETE',
    });
  }
}
