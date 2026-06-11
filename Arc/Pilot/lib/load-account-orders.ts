import 'server-only';

import {
  createWPGraphQLClient,
  getCustomerOrders,
  type WCCustomerOrdersResult,
} from '@arc-platform/core';
import { loadCustomerOrders } from '@arc-platform/next/server';

export type AccountOrdersModel =
  | { kind: 'no-auth' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; customer: WCCustomerOrdersResult };

/**
 * Resolves the E2E token fallback. The raw-JWT-from-env path (TEST_JWT_TOKEN /
 * E2E_CUSTOMER_JWT_TOKEN) exists ONLY for the Playwright suite, which has no WP
 * login UI session. It requires the explicit ARC_E2E_ALLOW_TOKEN_AUTH=true opt-in
 * set by playwright.config.cjs — it can never activate on a real deployment by
 * accident (audit H-2; fail-closed rule, AGENTS.md).
 */
function e2eTokenFallback(): string {
  if (process.env.ARC_E2E_ALLOW_TOKEN_AUTH !== 'true') return '';
  return process.env.E2E_CUSTOMER_JWT_TOKEN?.trim() || process.env.TEST_JWT_TOKEN?.trim() || '';
}

/**
 * Order history via WPGraphQL using the ADR-0009 cookie bridge: the access JWT
 * set at /account/login (with auto-refresh) is the auth path.
 */
export async function loadAccountOrders(): Promise<AccountOrdersModel> {
  const endpoint = process.env.ARC_GRAPHQL_ENDPOINT ?? process.env.WP_GRAPHQL_ENDPOINT;
  if (!endpoint) {
    return { kind: 'error', message: 'ARC_GRAPHQL_ENDPOINT is not configured.' };
  }

  try {
    const customer = await loadCustomerOrders({ first: 10 }, endpoint);
    if (customer) {
      return { kind: 'ready', customer };
    }

    const e2eToken = e2eTokenFallback();
    if (e2eToken) {
      const client = createWPGraphQLClient({ endpoint, authToken: () => e2eToken });
      return { kind: 'ready', customer: await getCustomerOrders(client, { first: 10 }) };
    }

    return { kind: 'no-auth' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load order history.';
    return { kind: 'error', message };
  }
}
