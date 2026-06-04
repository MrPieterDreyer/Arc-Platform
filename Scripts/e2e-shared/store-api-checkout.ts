import type { APIRequestContext } from '@playwright/test';

const CART_TOKEN_HEADER = 'Cart-Token';
const NONCE_HEADER = 'Nonce';
const DEFAULT_STORE_API_TIMEOUT_MS = 45_000;

export function storeApiBase(wpUrl: string): string {
  const base = wpUrl.endsWith('/') ? wpUrl.slice(0, -1) : wpUrl;
  return `${base}/wp-json/wc/store/v1`;
}

function readHeader(headers: Record<string, string>, name: string): string | undefined {
  return headers[name.toLowerCase()] ?? headers[name];
}

function readCartToken(headers: Record<string, string>): string | undefined {
  return readHeader(headers, CART_TOKEN_HEADER);
}

function readNonce(headers: Record<string, string>): string | undefined {
  return readHeader(headers, NONCE_HEADER);
}

function storeApiHeaders(cartToken: string, nonce?: string): Record<string, string> {
  const headers: Record<string, string> = {};
  if (cartToken) headers[CART_TOKEN_HEADER] = cartToken;
  if (nonce) {
    headers[NONCE_HEADER] = nonce;
    headers['X-WC-Store-API-Nonce'] = nonce;
  }
  return headers;
}

/**
 * Establish a Store API session, add a line item, return the Cart-Token for follow-up calls.
 */
export async function seedStoreApiCart(
  request: APIRequestContext,
  wpUrl: string,
  productId: number,
): Promise<{ cartToken: string; itemsCount: number }> {
  const base = storeApiBase(wpUrl);
  const timeout = DEFAULT_STORE_API_TIMEOUT_MS;
  const cartRes = await request.get(`${base}/cart`, { timeout });
  if (!cartRes.ok()) {
    throw new Error(`GET /cart failed: ${cartRes.status()}`);
  }

  let cartToken = readCartToken(cartRes.headers()) ?? '';
  let nonce = readNonce(cartRes.headers());
  const addRes = await request.post(`${base}/cart/add-item`, {
    data: { id: productId, quantity: 1 },
    headers: storeApiHeaders(cartToken, nonce),
    timeout,
  });
  if (!addRes.ok()) {
    const body = await addRes.text().catch(() => '');
    throw new Error(
      `POST /cart/add-item failed: ${addRes.status()} (productId=${productId})${body ? ` — ${body.slice(0, 200)}` : ''}`,
    );
  }

  const nextToken = readCartToken(addRes.headers());
  if (nextToken) cartToken = nextToken;
  const nextNonce = readNonce(addRes.headers());
  if (nextNonce) nonce = nextNonce;

  const body = (await addRes.json()) as { items_count?: number };
  return { cartToken, itemsCount: body.items_count ?? 1 };
}

export interface StoreApiCheckoutDraft {
  order_id: number;
  billing_address?: unknown;
  shipping_address?: unknown;
  status?: string;
  payment_result?: unknown;
}

/**
 * GET /checkout — draft order for the current Cart-Token session (ARC-API-05).
 */
export async function fetchStoreApiCheckoutDraft(
  request: APIRequestContext,
  wpUrl: string,
  cartToken: string,
): Promise<{ ok: boolean; status: number; draft: StoreApiCheckoutDraft | null }> {
  const res = await request.get(`${storeApiBase(wpUrl)}/checkout`, {
    headers: storeApiHeaders(cartToken),
    timeout: DEFAULT_STORE_API_TIMEOUT_MS,
  });
  if (!res.ok()) {
    return { ok: false, status: res.status(), draft: null };
  }
  const draft = (await res.json()) as StoreApiCheckoutDraft;
  return { ok: true, status: res.status(), draft };
}

/** True when Stripe sandbox keys are configured for @payment E2E. */
export function hasStripeSandboxEnv(): boolean {
  const publishable =
    process.env.E2E_STRIPE_PUBLISHABLE_KEY ?? process.env.STRIPE_PUBLISHABLE_KEY ?? '';
  const secret = process.env.E2E_STRIPE_SECRET_KEY ?? process.env.STRIPE_SECRET_KEY ?? '';
  return (
    publishable.startsWith('pk_test_') &&
    secret.startsWith('sk_test_') &&
    publishable.length > 10 &&
    secret.length > 10
  );
}

export function stripeSandboxSkipMessage(): string {
  return (
    'Stripe sandbox not configured — set E2E_STRIPE_PUBLISHABLE_KEY and E2E_STRIPE_SECRET_KEY ' +
    '(or STRIPE_PUBLISHABLE_KEY / STRIPE_SECRET_KEY) to run @payment tests.'
  );
}
