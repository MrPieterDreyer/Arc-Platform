/**
 * Contract tests — Checkout API (ARC-API-05)
 *
 * These tests run against a live wp-env WordPress instance.
 * All tests are gated behind CI_WP_ENV=true and skip cleanly in unit-test runs.
 *
 * Full submitCheckout testing (payment tokens) is gated to Phase 5 E2E.
 */
import { beforeAll, describe, expect, test } from 'vitest';
import { WooClient } from '../../client/WooClient';
import { addItem, getCart } from '../../store-api/cart';
import { getCheckoutSchema } from '../../store-api/checkout';

// Use globalThis cast to avoid requiring @types/node in tsconfig lib
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const env = (globalThis as any).process?.env ?? {};
const client = new WooClient({
  baseUrl: (env.WP_URL as string | undefined) ?? 'http://localhost:8888',
});

describe('Checkout API — ARC-API-05', () => {
  // GET /checkout requires an authenticated session with a non-empty cart.
  // Establish the session (getCart captures the Cart-Token) and add an item.
  beforeAll(async () => {
    if (!env.CI_WP_ENV) return;
    await getCart(client);
    await addItem(client, { id: Number(env.TEST_PRODUCT_ID ?? '1'), quantity: 1 });
  });

  // -------------------------------------------------------------------------
  // getCheckoutSchema
  // -------------------------------------------------------------------------

  test.skipIf(!env.CI_WP_ENV)(
    'getCheckoutSchema returns the checkout draft order (order_id + addresses)',
    async () => {
      const schema = await getCheckoutSchema(client);
      // GET /checkout returns the draft ORDER, not a cart — assert order fields.
      expect(schema).toHaveProperty('order_id');
      expect(schema).toHaveProperty('billing_address');
      expect(schema).toHaveProperty('shipping_address');
    },
  );

  // -------------------------------------------------------------------------
  // getPaymentGateways — WC Store API v1 has NO payment-gateways endpoint.
  // Available gateways are surfaced through the checkout flow, not a list route,
  // so this is not contract-testable against the Store API. See getPaymentGateways
  // JSDoc; revisit when a gateway-discovery strategy is chosen (Phase 5).
  // -------------------------------------------------------------------------

  test.skip('getPaymentGateways — no Store API v1 list endpoint (Phase 5 decision)', () => {});

  // -------------------------------------------------------------------------
  // submitCheckout
  // -------------------------------------------------------------------------

  test.skip(
    'submitCheckout requires a seeded cart with items + valid payment token — covered in Phase 5 E2E',
  );
});
