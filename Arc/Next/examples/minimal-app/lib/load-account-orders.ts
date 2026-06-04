import 'server-only';

import { createWPGraphQLClient, getCustomerOrders, type WCCustomerOrdersResult } from '@arc/core';

export type AccountOrdersModel =
  | { kind: 'no-auth' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; customer: WCCustomerOrdersResult };

/**
 * Order history via WPGraphQL — requires `TEST_JWT_TOKEN` (JWT auth spike / ADR-0009).
 * Token is read server-side only; never exposed to the browser.
 */
export async function loadAccountOrders(): Promise<AccountOrdersModel> {
  const token =
    process.env.E2E_CUSTOMER_JWT_TOKEN?.trim() || process.env.TEST_JWT_TOKEN?.trim() || '';
  if (!token) {
    return { kind: 'no-auth' };
  }

  const endpoint = process.env.ARC_GRAPHQL_ENDPOINT ?? process.env.WP_GRAPHQL_ENDPOINT;
  if (!endpoint) {
    return { kind: 'error', message: 'ARC_GRAPHQL_ENDPOINT is not configured.' };
  }

  try {
    const client = createWPGraphQLClient({
      endpoint,
      authToken: () => token,
    });
    const customer = await getCustomerOrders(client, { first: 10 });
    return { kind: 'ready', customer };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load order history.';
    return { kind: 'error', message };
  }
}
