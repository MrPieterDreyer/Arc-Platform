import 'server-only';

import { WooClient, type WooClientOptions } from '@arc/core';
import { cookies } from 'next/headers';
import { ARC_CART_TOKEN_COOKIE } from './constants.js';

/** ADR-0006 defaults; set `ARC_CART_COOKIE_SECURE=false` for local HTTP E2E (http://localhost). */
function cartCookieSecure(): boolean {
  const override = process.env.ARC_CART_COOKIE_SECURE;
  if (override === 'true') return true;
  if (override === 'false') return false;
  return true;
}

const secure = cartCookieSecure();

export const CART_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: secure ? ('none' as const) : ('lax' as const),
  secure,
  path: '/',
  maxAge: 2_592_000,
};

/**
 * WC Store API client with Cart-Token bridged to the `arc_cart_token` HttpOnly cookie.
 * Cookie writes only succeed in Server Actions and Route Handlers — not during RSC render.
 */
function persistCartToken(jar: Awaited<ReturnType<typeof cookies>>, token: string): void {
  try {
    jar.set(ARC_CART_TOKEN_COOKIE, token, CART_COOKIE_OPTIONS);
  } catch {
    // Cookie mutation is forbidden during RSC render; the request token remains valid for this read.
  }
}

export async function createCartClient(
  baseUrl: string,
  extra?: Omit<WooClientOptions, 'baseUrl' | 'getCartToken' | 'onCartToken'>,
): Promise<WooClient> {
  const jar = await cookies();
  return new WooClient({
    baseUrl,
    ...extra,
    getCartToken: () => jar.get(ARC_CART_TOKEN_COOKIE)?.value ?? null,
    onCartToken: (token) => {
      persistCartToken(jar, token);
    },
  });
}

/**
 * WC client for Server Components that only read cart state.
 * Skips `onCartToken` persistence so a rotated token from GET /cart cannot throw during RSC.
 */
export async function createReadOnlyCartClient(
  baseUrl: string,
  extra?: Omit<WooClientOptions, 'baseUrl' | 'getCartToken' | 'onCartToken' | 'onNonce'>,
): Promise<WooClient> {
  const jar = await cookies();
  return new WooClient({
    baseUrl,
    ...extra,
    getCartToken: () => jar.get(ARC_CART_TOKEN_COOKIE)?.value ?? null,
    onCartToken: () => undefined,
    onNonce: () => undefined,
  });
}

/** Read the cart token in Server Components (read-only). */
export async function readCartTokenValue(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(ARC_CART_TOKEN_COOKIE)?.value ?? null;
}

/**
 * Re-set `arc_cart_token` with ADR-0006 attributes even when the value is unchanged,
 * so `Max-Age` resets on every successful cart mutation (D-05).
 */
export async function refreshCartTokenCookie(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(ARC_CART_TOKEN_COOKIE)?.value;
  if (!token) return;
  persistCartToken(jar, token);
}
