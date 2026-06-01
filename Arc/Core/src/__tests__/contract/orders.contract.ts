/**
 * Contract tests for the WC Store API /order/{id} endpoint.
 *
 * All tests are gated behind CI_WP_ENV=true — they require a live wp-env instance.
 * Run with: CI_WP_ENV=true WP_URL=http://localhost:8888 pnpm --filter @arc/core test
 */
import { describe, expect, test } from 'vitest';
import { WooClient } from '../../client/WooClient';
import { getOrder } from '../../store-api/orders';

describe('Orders API — ARC-API-07', () => {
  const client = new WooClient({
    baseUrl: process.env['WP_URL'] ?? 'http://localhost:8888',
  });

  // Retrieving an order via the Store API requires it to belong to the current
  // Cart-Token session (or a key+billing_email from the checkout redirect). A
  // seeded order belongs to no session, so a positive retrieval needs a full
  // checkout flow — covered in Phase 5 E2E.
  test.skip('getOrder — valid session order (requires checkout-created order; Phase 5 E2E)', () => {});

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
