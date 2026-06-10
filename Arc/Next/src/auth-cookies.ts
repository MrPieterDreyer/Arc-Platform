import 'server-only';

import { cookies } from 'next/headers';
import { ARC_AUTH_TOKEN_COOKIE, ARC_REFRESH_TOKEN_COOKIE } from './constants.js';
import { CART_COOKIE_OPTIONS } from './cookies.js';

// ADR-0009 — the two auth cookies reuse the ADR-0006 attribute set (HttpOnly,
// SameSite=None, Secure, Path=/) and differ only in lifetime: the access JWT is
// short-lived to bound blast radius; the refresh JWT spans the customer session.

/** 15 minutes — matches wp-graphql-jwt-authentication's default access TTL. */
export const AUTH_COOKIE_OPTIONS = {
  ...CART_COOKIE_OPTIONS,
  maxAge: 900,
} as const;

/** 14 days. */
export const REFRESH_COOKIE_OPTIONS = {
  ...CART_COOKIE_OPTIONS,
  maxAge: 1_209_600,
} as const;

/**
 * Minimum credible JWT length — mirrors @arc-platform/core's auth guard (audit H-2:
 * reject empty/short tokens before they reach a cookie).
 */
const MIN_TOKEN_LENGTH = 16;

function assertToken(token: string, label: string): void {
  if (token.trim().length < MIN_TOKEN_LENGTH) {
    throw new Error(`Refusing to persist an empty or malformed ${label} cookie (ADR-0009)`);
  }
}

/**
 * Writes both auth cookies after a successful login. Only callable from Server
 * Actions / Route Handlers — unlike the cart bridge this THROWS on a forbidden
 * RSC write: a login that cannot persist its session is a failure, not a no-op.
 */
export async function persistAuthCookies(authToken: string, refreshToken: string): Promise<void> {
  assertToken(authToken, 'auth token');
  assertToken(refreshToken, 'refresh token');
  const jar = await cookies();
  jar.set(ARC_AUTH_TOKEN_COOKIE, authToken, AUTH_COOKIE_OPTIONS);
  jar.set(ARC_REFRESH_TOKEN_COOKIE, refreshToken, REFRESH_COOKIE_OPTIONS);
}

/**
 * Rotates only the access cookie after a `refreshJwtAuthToken` exchange.
 * Swallows the RSC-render write restriction (same posture as the cart bridge):
 * the fresh token is still valid for the current request, and the next Server
 * Action / Route Handler will persist a rotation successfully.
 */
export async function rotateAuthCookie(authToken: string): Promise<void> {
  assertToken(authToken, 'auth token');
  const jar = await cookies();
  try {
    jar.set(ARC_AUTH_TOKEN_COOKIE, authToken, AUTH_COOKIE_OPTIONS);
  } catch {
    // Cookie mutation is forbidden during RSC render; the rotated token remains valid for this read.
  }
}

/** Deletes both auth cookies (logout). */
export async function clearAuthCookies(): Promise<void> {
  const jar = await cookies();
  jar.delete(ARC_AUTH_TOKEN_COOKIE);
  jar.delete(ARC_REFRESH_TOKEN_COOKIE);
}

/** Read the access JWT in Server Components (read-only). */
export async function readAuthTokenValue(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(ARC_AUTH_TOKEN_COOKIE)?.value ?? null;
}

/** Read the refresh JWT in Server Components (read-only). */
export async function readRefreshTokenValue(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(ARC_REFRESH_TOKEN_COOKIE)?.value ?? null;
}
