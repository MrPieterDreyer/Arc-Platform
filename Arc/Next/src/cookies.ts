import 'server-only';

import { WooClient, type WooClientOptions } from '@arc/core';
import { cookies } from 'next/headers';
import { ARC_CART_TOKEN_COOKIE } from './constants.js';

export const CART_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'none' as const,
  secure: true,
  path: '/',
  maxAge: 2_592_000,
};

/**
 * WC Store API client with Cart-Token bridged to the `arc_cart_token` HttpOnly cookie.
 * Cookie writes only succeed in Server Actions and Route Handlers — not during RSC render.
 */
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
      jar.set(ARC_CART_TOKEN_COOKIE, token, CART_COOKIE_OPTIONS);
    },
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
  jar.set(ARC_CART_TOKEN_COOKIE, token, CART_COOKIE_OPTIONS);
}
