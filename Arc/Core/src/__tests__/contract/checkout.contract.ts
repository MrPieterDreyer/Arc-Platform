/**
 * Contract tests — Checkout API (ARC-API-05)
 *
 * These tests run against a live wp-env WordPress instance.
 * All tests are gated behind CI_WP_ENV=true and skip cleanly in unit-test runs.
 *
 * Full submitCheckout testing (payment tokens) is gated to Phase 5 E2E.
 */
import { describe, expect, test } from 'vitest';
import { WooClient } from '../../client/WooClient';
import { getCheckoutSchema, getPaymentGateways } from '../../store-api/checkout';

// Use globalThis cast to avoid requiring @types/node in tsconfig lib
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const env = (globalThis as any).process?.env ?? {};
const client = new WooClient({
  baseUrl: (env.WP_URL as string | undefined) ?? 'http://localhost:8888',
});

describe('Checkout API — ARC-API-05', () => {
  // -------------------------------------------------------------------------
  // getCheckoutSchema
  // -------------------------------------------------------------------------

  test.skipIf(!env.CI_WP_ENV)(
    'getCheckoutSchema returns cart-shaped data with items array and totals object',
    async () => {
      const schema = await getCheckoutSchema(client);
      expect(schema).toHaveProperty('items');
      expect(Array.isArray(schema.items)).toBe(true);
      expect(schema).toHaveProperty('totals');
      expect(typeof schema.totals).toBe('object');
    },
  );

  // -------------------------------------------------------------------------
  // getPaymentGateways
  // -------------------------------------------------------------------------

  test.skipIf(!env.CI_WP_ENV)(
    'getPaymentGateways returns an array with id and enabled fields',
    async () => {
      const gateways = await getPaymentGateways(client);
      expect(Array.isArray(gateways)).toBe(true);
      if (gateways.length > 0) {
        expect(typeof gateways[0].id).toBe('string');
        expect(typeof gateways[0].enabled).toBe('boolean');
      }
    },
  );

  // -------------------------------------------------------------------------
  // submitCheckout
  // -------------------------------------------------------------------------

  test.skip(
    'submitCheckout requires a seeded cart with items + valid payment token — covered in Phase 5 E2E',
  );
});
