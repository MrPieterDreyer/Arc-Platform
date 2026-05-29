/**
 * Customer API contract tests — ARC-API-06 / ARC-GQL scope
 *
 * These tests require a running wp-env WordPress instance.
 * They are skipped in unit-test CI and only run when CI_WP_ENV=true.
 *
 * Prerequisites:
 *   - WP_URL env var pointing to wp-env base (default: http://localhost:8888)
 *   - WP_GRAPHQL_ENDPOINT env var (default: http://localhost:8888/graphql)
 *   - TEST_JWT_TOKEN env var (optional — required for auth GQL tests)
 */
import { describe, expect, test } from 'vitest';
import { WooClient } from '../../client/WooClient.js';
import { createWPGraphQLClient } from '../../graphql/client.js';
import { getCustomerOrders } from '../../graphql/customer.js';
import { getCustomer, updateCustomer } from '../../store-api/customer.js';

const client = new WooClient({
  baseUrl: process.env.WP_URL ?? 'http://localhost:8888',
});

const gqlClient = createWPGraphQLClient({
  endpoint: process.env.WP_GRAPHQL_ENDPOINT ?? 'http://localhost:8888/graphql',
  authToken: () => process.env.TEST_JWT_TOKEN ?? null,
});

const gqlClientNoAuth = createWPGraphQLClient({
  endpoint: process.env.WP_GRAPHQL_ENDPOINT ?? 'http://localhost:8888/graphql',
  // No authToken — simulates unauthenticated request
});

describe('Customer API — ARC-API-06', () => {
  test.skipIf(!process.env.CI_WP_ENV)(
    'getCustomer returns session-scoped billing/shipping — no orders key',
    async () => {
      const customer = await getCustomer(client);

      expect(customer).toHaveProperty('billing');
      expect(typeof customer.billing.first_name).toBe('string');
      expect(typeof customer.billing.email).toBe('string');
      expect(customer).toHaveProperty('shipping');

      // Verify session-scoped limitation: no orders in Store API response
      expect(customer).not.toHaveProperty('orders');
    },
  );

  test.skipIf(!process.env.CI_WP_ENV)(
    'updateCustomer persists billing address patch to session',
    async () => {
      const updated = await updateCustomer(client, {
        billing: { first_name: 'TestCustomer' },
      });

      expect(updated.billing.first_name).toBe('TestCustomer');
    },
  );
});

describe('Customer GQL Orders — ARC-GQL scope', () => {
  test.skipIf(!process.env.CI_WP_ENV)(
    'getCustomerOrders without auth throws — WPGraphQL returns null for unauthenticated customer',
    async () => {
      await expect(getCustomerOrders(gqlClientNoAuth)).rejects.toThrow(
        /null for customer|unauthenticated/i,
      );
    },
  );

  test.skipIf(!process.env.CI_WP_ENV || !process.env.TEST_JWT_TOKEN)(
    'getCustomerOrders with valid JWT returns customer with paginated orders',
    async () => {
      const result = await getCustomerOrders(gqlClient, { first: 5 });

      expect(typeof result.email).toBe('string');
      expect(Array.isArray(result.orders.nodes)).toBe(true);
      expect(typeof result.orders.pageInfo.hasNextPage).toBe('boolean');
    },
  );
});
