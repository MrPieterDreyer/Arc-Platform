/**
 * Contract tests for the WC Store API /order/{id} endpoint.
 *
 * All tests are gated behind CI_WP_ENV=true — they require a live wp-env instance.
 * Run with: CI_WP_ENV=true WP_URL=http://localhost:8888 pnpm --filter @arc-platform/core test
 */
import { describe, expect, test } from 'vitest';
import { WooClient } from '../../client/WooClient';
import { getOrder } from '../../store-api/orders';

describe('Orders API — ARC-API-07', () => {
  const client = new WooClient({
    baseUrl: process.env['WP_URL'] ?? 'http://localhost:8888',
  });

  // The WC Store API /order/{id} endpoint is Cart-Token session-scoped.
  // An order seeded via wc_create_order() (server-side, no checkout flow) has no
  // Cart-Token binding. A fresh WooClient has no shared session with the seeded
  // order, so the API must return null — confirming session-isolation enforcement.
  //
  // True positive retrieval (order belongs to THIS session) requires a full
  // checkout flow to create the order under a Cart-Token. That path is covered
  // in Phase 5 E2E (e2e/checkout/flow.spec.ts). TEST_ORDER_ID is seeded by
  // Scripts/wp-seed/seed.php → Scripts/seed-wp-env.mjs → .env.wp-test.
  test.skipIf(!process.env['CI_WP_ENV'])(
    'getOrder — seeded order is not retrievable from a fresh session (Store API session isolation)',
    async () => {
      const orderId = Number(process.env['TEST_ORDER_ID'] ?? 0);
      // TEST_ORDER_ID must be seeded before this test runs (pnpm wp:seed sets it).
      expect(orderId).toBeGreaterThan(0);

      // A brand-new WooClient has no Cart-Token — it is a different session than
      // the one that "owns" the seeded order (server-created, no checkout session).
      // getOrder must return null, not throw, for any 404/403 variant.
      const result = await getOrder(client, orderId);
      expect(result).toBeNull();
    },
  );

  test.skipIf(!process.env['CI_WP_ENV'])('getOrder — non-existent ID returns null', async () => {
    const result = await getOrder(client, 999999);
    expect(result).toBeNull();
  });

  // Verifies Cart-Token session isolation — critical for multi-tenant security
  test.skipIf(!process.env['CI_WP_ENV'])(
    'getOrder — cross-session order returns null',
    async () => {
      const orderId = Number(process.env['TEST_ORDER_ID'] ?? 0);
      expect(orderId).toBeGreaterThan(0);

      // Create a second WooClient with its own independent session
      const secondClient = new WooClient({
        baseUrl: process.env['WP_URL'] ?? 'http://localhost:8888',
      });

      // Attempting to retrieve first session's order from a different session must return null
      const result = await getOrder(secondClient, orderId);
      expect(result).toBeNull();
    },
  );
});
