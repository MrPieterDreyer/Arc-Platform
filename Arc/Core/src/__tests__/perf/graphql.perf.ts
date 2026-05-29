/**
 * GQL performance budget tests — ARC-GQL-07
 *
 * Each test asserts that a single round-trip GQL query completes in < 500ms
 * when running against a local wp-env instance. This budget is deliberately
 * generous to account for network + PHP startup time in CI Docker containers.
 *
 * All tests are gated on CI_WP_ENV — they are skipped in unit test runs where
 * no WordPress instance is available.
 *
 * Prerequisites:
 *   - wp-env running (pnpm wp-env start in Pilot)
 *   - WP_GRAPHQL_ENDPOINT set (defaults to http://localhost:8888/graphql)
 *   - CI_WP_ENV set to any non-empty value
 *   - WPGraphQL + WPGraphQL for WooCommerce activated
 *   - TEST_PRODUCT_SLUG and TEST_COLLECTION_SLUG seeded in WC
 */

import { describe, expect, test } from 'vitest';
import { createWPGraphQLClient } from '../../graphql/client.js';
import {
  getCollection,
  getCollectionProducts,
  listCollections,
} from '../../graphql/collections.js';
import { getCustomerOrders } from '../../graphql/customer.js';
import { getProduct, getProducts } from '../../graphql/products.js';
import { searchProducts } from '../../graphql/search.js';

/** GQL round-trip budget in milliseconds (per ARC-GQL-07). */
const PERF_BUDGET_MS = 500;

describe('GQL perf budget — ARC-GQL-07', () => {
  const gqlClient = createWPGraphQLClient({
    endpoint: process.env['WP_GRAPHQL_ENDPOINT'] ?? 'http://localhost:8888/graphql',
  });

  test.skipIf(!process.env['CI_WP_ENV'])('getProduct < 500ms', async () => {
    const start = performance.now();
    await getProduct(gqlClient, process.env['TEST_PRODUCT_SLUG'] ?? 'test-product');
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(PERF_BUDGET_MS);
  });

  test.skipIf(!process.env['CI_WP_ENV'])('getProducts (listProducts) < 500ms', async () => {
    const start = performance.now();
    await getProducts(gqlClient, { first: 10 });
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(PERF_BUDGET_MS);
  });

  test.skipIf(!process.env['CI_WP_ENV'])('getCollection < 500ms', async () => {
    const start = performance.now();
    await getCollection(gqlClient, process.env['TEST_COLLECTION_SLUG'] ?? 'uncategorized');
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(PERF_BUDGET_MS);
  });

  test.skipIf(!process.env['CI_WP_ENV'])('listCollections < 500ms', async () => {
    const start = performance.now();
    await listCollections(gqlClient, 10);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(PERF_BUDGET_MS);
  });

  test.skipIf(!process.env['CI_WP_ENV'])('getCollectionProducts < 500ms', async () => {
    const start = performance.now();
    await getCollectionProducts(gqlClient, process.env['TEST_COLLECTION_SLUG'] ?? 'uncategorized', {
      first: 10,
    });
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(PERF_BUDGET_MS);
  });

  test.skipIf(!process.env['CI_WP_ENV'])('searchProducts < 500ms', async () => {
    const start = performance.now();
    await searchProducts(gqlClient, 'test', { first: 10 });
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(PERF_BUDGET_MS);
  });

  test.skipIf(!process.env['CI_WP_ENV'])('getCustomerOrders (GQL) < 500ms', async () => {
    // getCustomerOrders may return an error without auth — measure elapsed
    // regardless of result. The perf budget applies to authenticated and
    // unauthenticated responses alike (both are valid WPGraphQL round-trips).
    const start = performance.now();
    try {
      await getCustomerOrders(gqlClient, { first: 5 });
    } catch {
      // Unauthenticated calls throw — still count the elapsed time
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(PERF_BUDGET_MS);
  });
});
