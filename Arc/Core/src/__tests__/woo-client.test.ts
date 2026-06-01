import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WooClient, WooClientError } from '../client/WooClient';
import { ArcNetworkError, ArcParseError, isArcError } from '../types/errors';
import type { WooCart } from '../types/woo';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal stub cart returned by fetch mocks. */
const STUB_CART: WooCart = {
  coupons: [],
  shipping_rates: [],
  shipping_address: {
    first_name: '',
    last_name: '',
    company: '',
    address_1: '',
    address_2: '',
    city: '',
    state: '',
    postcode: '',
    country: '',
    phone: '',
  },
  billing_address: {
    first_name: '',
    last_name: '',
    company: '',
    address_1: '',
    address_2: '',
    city: '',
    state: '',
    postcode: '',
    country: '',
    email: '',
    phone: '',
  },
  items: [],
  item_count: 0,
  items_weight: 0,
  cross_sells: [],
  needs_payment: false,
  needs_shipping: false,
  has_calculated_shipping: false,
  fees: [],
  totals: {
    total_items: '0',
    total_items_tax: '0',
    total_fees: '0',
    total_fees_tax: '0',
    total_discount: '0',
    total_discount_tax: '0',
    total_shipping: '0',
    total_shipping_tax: '0',
    total_price: '0',
    total_tax: '0',
    tax_lines: [],
    currency_code: 'USD',
    currency_symbol: '$',
    currency_minor_unit: 2,
    currency_decimal_separator: '.',
    currency_thousand_separator: ',',
    currency_prefix: '$',
    currency_suffix: '',
  },
  errors: [],
  payment_requirements: [],
  extensions: {},
};

function makeJsonResponse(
  body: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
): Response {
  const headers = new Headers({ 'content-type': 'application/json', ...extraHeaders });
  return new Response(JSON.stringify(body), { status, headers });
}

// ---------------------------------------------------------------------------
// Cart-Token extraction + injection
// ---------------------------------------------------------------------------

describe('WooClient — Cart-Token handling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('calls onCartToken with the token received in the first response', async () => {
    const onCartToken = vi.fn();

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      makeJsonResponse(STUB_CART, 200, { 'Cart-Token': 'tok_abc123' }),
    );

    const client = new WooClient({
      baseUrl: 'https://shop.example.com',
      onCartToken,
    });

    await client.getCart();
    expect(onCartToken).toHaveBeenCalledOnce();
    expect(onCartToken).toHaveBeenCalledWith('tok_abc123');
  });

  it('does NOT call onCartToken when token is unchanged', async () => {
    const onCartToken = vi.fn();
    const storedToken = 'tok_existing';

    vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      makeJsonResponse(STUB_CART, 200, { 'Cart-Token': 'tok_existing' }),
    );

    const client = new WooClient({
      baseUrl: 'https://shop.example.com',
      onCartToken,
      getCartToken: () => storedToken,
    });

    await client.getCart();
    await client.getCart();
    expect(onCartToken).not.toHaveBeenCalled();
  });

  it('injects Cart-Token header from getCartToken on subsequent requests', async () => {
    let capturedHeaders: Headers | undefined;

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
      capturedHeaders = new Headers(init?.headers);
      return makeJsonResponse(STUB_CART, 200, { 'Cart-Token': 'tok_abc123' });
    });

    const client = new WooClient({
      baseUrl: 'https://shop.example.com',
      getCartToken: () => 'tok_abc123',
    });

    await client.getCart();
    expect(capturedHeaders?.get('Cart-Token')).toBe('tok_abc123');
  });

  it('does NOT inject Cart-Token header when getCartToken returns null', async () => {
    let capturedHeaders: Headers | undefined;

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
      capturedHeaders = new Headers(init?.headers);
      return makeJsonResponse(STUB_CART, 200);
    });

    const client = new WooClient({ baseUrl: 'https://shop.example.com' });
    await client.getCart();
    expect(capturedHeaders?.has('Cart-Token')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Nonce retry
// ---------------------------------------------------------------------------

describe('WooClient — nonce retry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('refreshes nonce and retries once on rest_cookie_invalid_nonce', async () => {
    const onNonce = vi.fn();
    const nonceError = {
      code: 'rest_cookie_invalid_nonce',
      message: 'Cookie nonce is invalid',
      data: { status: 401 },
    };

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(makeJsonResponse(nonceError, 401))
      .mockResolvedValueOnce(makeJsonResponse(STUB_CART, 200));

    const client = new WooClient({
      baseUrl: 'https://shop.example.com',
      getNonce: vi.fn().mockReturnValue('fresh_nonce_xyz'),
      onNonce,
    });

    const cart = await client.getCart();
    expect(cart).toMatchObject({ item_count: 0 });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(onNonce).toHaveBeenCalledWith('fresh_nonce_xyz');
  });

  it('throws if nonce refresh returns null and nonce error persists', async () => {
    const nonceError = {
      code: 'rest_cookie_invalid_nonce',
      message: 'Cookie nonce is invalid',
      data: { status: 401 },
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(makeJsonResponse(nonceError, 401));

    const client = new WooClient({
      baseUrl: 'https://shop.example.com',
      getNonce: vi.fn().mockReturnValue(null),
    });

    await expect(client.getCart()).rejects.toBeInstanceOf(WooClientError);
  });

  it('does NOT retry on non-nonce 4xx errors', async () => {
    const notFoundError = {
      code: 'rest_no_route',
      message: 'Not found',
      data: { status: 404 },
    };

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(makeJsonResponse(notFoundError, 404));

    const client = new WooClient({ baseUrl: 'https://shop.example.com' });

    await expect(client.getCart()).rejects.toBeInstanceOf(WooClientError);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// 5xx backoff retry
// ---------------------------------------------------------------------------

describe('WooClient — 5xx backoff retry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('retries on 500 and succeeds on third attempt', async () => {
    const serverError = {
      code: 'server_error',
      message: 'Internal Server Error',
      data: { status: 500 },
    };

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(makeJsonResponse(serverError, 500))
      .mockResolvedValueOnce(makeJsonResponse(serverError, 500))
      .mockResolvedValueOnce(makeJsonResponse(STUB_CART, 200));

    const client = new WooClient({
      baseUrl: 'https://shop.example.com',
    });

    const promise = client.getCart();
    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(2000);
    const cart = await promise;
    expect(cart).toMatchObject({ item_count: 0 });
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  it('throws after 3 failed 500 attempts', async () => {
    const serverError = {
      code: 'server_error',
      message: 'Internal Server Error',
      data: { status: 500 },
    };

    vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      makeJsonResponse(serverError, 500),
    );

    const client = new WooClient({ baseUrl: 'https://shop.example.com' });

    // Attach rejects assertion FIRST, then advance timers
    const assertion = expect(client.getCart()).rejects.toBeInstanceOf(WooClientError);
    await vi.advanceTimersByTimeAsync(3000);
    await assertion;
  });
});

// ---------------------------------------------------------------------------
// Timeout
// ---------------------------------------------------------------------------

describe('WooClient — timeout', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('aborts the request when timeout elapses', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          const signal = init?.signal as AbortSignal | undefined;
          if (signal) {
            signal.addEventListener('abort', () => reject(signal.reason));
          }
        }),
    );

    const client = new WooClient({
      baseUrl: 'https://shop.example.com',
      timeout: 50,
    });

    await expect(client.getCart()).rejects.toBeDefined();
  }, 5000);
});

// ---------------------------------------------------------------------------
// Cart operation methods
// ---------------------------------------------------------------------------

describe('WooClient — cart operations', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('addToCart posts to /cart/add-item with correct body', async () => {
    let capturedUrl: string | URL | Request | undefined;
    let capturedInit: RequestInit | undefined;

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      capturedUrl = url;
      capturedInit = init;
      return makeJsonResponse(STUB_CART, 200);
    });

    const client = new WooClient({ baseUrl: 'https://shop.example.com' });
    await client.addToCart(42, 2);

    expect(String(capturedUrl)).toContain('/cart/add-item');
    expect(capturedInit?.method).toBe('POST');
    expect(JSON.parse(capturedInit?.body as string)).toEqual({ id: 42, quantity: 2 });
  });

  it('updateCartItem posts to /cart/update-item', async () => {
    let capturedUrl: string | URL | Request | undefined;

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      capturedUrl = url;
      return makeJsonResponse(STUB_CART, 200);
    });

    const client = new WooClient({ baseUrl: 'https://shop.example.com' });
    await client.updateCartItem('abc-key', 3);
    expect(String(capturedUrl)).toContain('/cart/update-item');
  });

  it('removeCartItem sends DELETE to /cart/remove-item', async () => {
    let capturedInit: RequestInit | undefined;

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
      capturedInit = init;
      return makeJsonResponse(STUB_CART, 200);
    });

    const client = new WooClient({ baseUrl: 'https://shop.example.com' });
    await client.removeCartItem('abc-key');
    expect(capturedInit?.method).toBe('DELETE');
  });

  it('applyCoupon posts to the WC Store API /cart/coupons endpoint', async () => {
    let capturedUrl: string | URL | Request | undefined;
    let capturedInit: RequestInit | undefined;

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      capturedUrl = url;
      capturedInit = init;
      return makeJsonResponse(STUB_CART, 200);
    });

    const client = new WooClient({ baseUrl: 'https://shop.example.com' });
    await client.applyCoupon('SAVE10');
    expect(String(capturedUrl)).toContain('/cart/coupons');
    expect(String(capturedUrl)).not.toContain('/cart/apply-coupon');
    expect(capturedInit?.method).toBe('POST');
    expect(JSON.parse(capturedInit?.body as string)).toEqual({ code: 'SAVE10' });
  });

  it('removeCoupon sends DELETE to /cart/coupons/{code}', async () => {
    let capturedUrl: string | URL | Request | undefined;
    let capturedInit: RequestInit | undefined;

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      capturedUrl = url;
      capturedInit = init;
      return makeJsonResponse(STUB_CART, 200);
    });

    const client = new WooClient({ baseUrl: 'https://shop.example.com' });
    await client.removeCoupon('SAVE10');
    expect(String(capturedUrl)).toContain('/cart/coupons/SAVE10');
    expect(capturedInit?.method).toBe('DELETE');
  });
});

// ---------------------------------------------------------------------------
// WooClientError
// ---------------------------------------------------------------------------

describe('WooClientError', () => {
  it('carries code, status, and data from the API error', () => {
    const err = new WooClientError({
      code: 'product_invalid_id',
      message: 'Invalid product ID',
      data: { status: 400 },
    });
    expect(err.code).toBe('product_invalid_id');
    expect(err.status).toBe(400);
    expect(err.message).toBe('Invalid product ID');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('WooClientError');
  });

  it('exposes a normalized ArcError (type "api") via .arcError', () => {
    const err = new WooClientError({
      code: 'product_invalid_id',
      message: 'Invalid product ID',
      data: { status: 400, params: { id: 'bad' } },
    });
    expect(isArcError(err)).toBe(true);
    expect(err.arcError).toEqual({
      type: 'api',
      status: 400,
      code: 'product_invalid_id',
      message: 'Invalid product ID',
      data: { status: 400, params: { id: 'bad' } },
    });
  });
});

// ---------------------------------------------------------------------------
// ArcError normalization (ARC-API-03)
// ---------------------------------------------------------------------------

describe('WooClient — error normalization (ARC-API-03)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('normalizes a fetch network failure into ArcNetworkError', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));

    const client = new WooClient({ baseUrl: 'https://shop.example.com' });

    const err = await client.getCart().catch((e) => e);
    expect(err).toBeInstanceOf(ArcNetworkError);
    expect(isArcError(err)).toBe(true);
    expect(err.arcError.type).toBe('network');
    expect(err.arcError.cause).toBeInstanceOf(TypeError);
  });

  it('normalizes a malformed JSON body into ArcParseError', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{ not valid json', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const client = new WooClient({ baseUrl: 'https://shop.example.com' });

    const err = await client.getCart().catch((e) => e);
    expect(err).toBeInstanceOf(ArcParseError);
    expect(err.arcError.type).toBe('parse');
  });
});
