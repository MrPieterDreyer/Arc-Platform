import 'server-only';

import {
  createWPGraphQLClient,
  getCustomerOrders,
  loginCustomer,
  refreshAuthToken,
  type WCAuthCustomer,
  type WCCustomerOrdersResult,
} from '@arc/core';
import {
  clearAuthCookies,
  persistAuthCookies,
  readAuthTokenValue,
  readRefreshTokenValue,
  rotateAuthCookie,
} from './auth-cookies.js';

/**
 * Customer-auth helpers (`server-only`, ADR-0009).
 *
 * Like the cart helpers in actions.ts these are NOT `'use server'` actions — a
 * published library cannot export Server Actions. Consumers wrap them:
 *
 *   // app/_actions/auth.ts
 *   'use server';
 *   import { loginAction as login } from '@arc/next/server';
 *   export async function loginAction(username: string, password: string) {
 *     return login({ username, password });
 *   }
 *
 * Tokens never leave the server: login returns only the customer identity; the
 * JWTs live exclusively in the two HttpOnly cookies (auth-cookies.ts).
 */

function resolveGraphqlEndpoint(endpoint?: string): string {
  const url = endpoint ?? process.env.ARC_GRAPHQL_ENDPOINT;
  if (!url) {
    throw new Error('ARC_GRAPHQL_ENDPOINT is required for customer auth');
  }
  return url;
}

/**
 * Authenticates against wp-graphql-jwt-authentication and persists both auth
 * cookies. Throws on bad credentials or malformed tokens — consumers surface
 * the failure on the login form. Returns the customer identity only.
 */
export async function loginAction(
  credentials: { username: string; password: string },
  graphqlEndpoint?: string,
): Promise<WCAuthCustomer> {
  const client = createWPGraphQLClient({ endpoint: resolveGraphqlEndpoint(graphqlEndpoint) });
  const { authToken, refreshToken, customer } = await loginCustomer(client, credentials);
  await persistAuthCookies(authToken, refreshToken);
  return customer;
}

/** Deletes both auth cookies. Safe to call when already logged out. */
export async function logoutAction(): Promise<void> {
  await clearAuthCookies();
}

/**
 * Resolves a usable access JWT for the current request (ADR-0009 lifecycle):
 * 1. access cookie present → return it;
 * 2. else refresh cookie present → `refreshJwtAuthToken`, rotate the access
 *    cookie (write swallowed during RSC render), return the fresh token;
 * 3. else → null (anonymous).
 *
 * A failed refresh (revoked/expired refresh JWT) resolves to null rather than
 * throwing so RSC account pages degrade to their logged-out state.
 */
export async function getAuthToken(graphqlEndpoint?: string): Promise<string | null> {
  const accessToken = await readAuthTokenValue();
  if (accessToken) return accessToken;

  const refreshToken = await readRefreshTokenValue();
  if (!refreshToken) return null;

  try {
    const client = createWPGraphQLClient({ endpoint: resolveGraphqlEndpoint(graphqlEndpoint) });
    const freshToken = await refreshAuthToken(client, refreshToken);
    await rotateAuthCookie(freshToken);
    return freshToken;
  } catch {
    return null;
  }
}

/** True when the current request carries a live or refreshable customer session. */
export async function isAuthenticated(graphqlEndpoint?: string): Promise<boolean> {
  return (await getAuthToken(graphqlEndpoint)) !== null;
}

/**
 * Loads the authenticated customer's order history via the cookie bridge.
 * Returns null for anonymous visitors — no `TEST_JWT_TOKEN` escape hatch
 * (audit H-2). Upstream GraphQL errors propagate.
 */
export async function loadCustomerOrders(
  vars?: { first?: number; after?: string },
  graphqlEndpoint?: string,
): Promise<WCCustomerOrdersResult | null> {
  const token = await getAuthToken(graphqlEndpoint);
  if (!token) return null;

  const client = createWPGraphQLClient({
    endpoint: resolveGraphqlEndpoint(graphqlEndpoint),
    authToken: () => token,
  });
  return getCustomerOrders(client, vars);
}
