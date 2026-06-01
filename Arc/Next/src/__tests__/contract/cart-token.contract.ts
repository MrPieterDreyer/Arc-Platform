/**
 * ARC-NEXT-02 — Cart-Token round-trip contract (live WC backend)
 *
 * The @arc/next cookie bridge (cookies.ts) is unit-tested in isolation. This
 * contract test validates the EXTERNAL dependency that bridge relies on: that a
 * real WC Store API issues a Cart-Token on first write and resumes the same
 * cart when that token is replayed. It uses bare @arc/core clients (no Next
 * runtime) so it can run against a seeded wp-env.
 *
 * Run with a live backend:
 *   CI_WP_ENV=true ARC_WC_URL=http://localhost:8888 TEST_PRODUCT_ID=15 \
 *     pnpm --filter @arc/next exec vitest run
 */
import { addItem, getCart, WooClient } from '@arc/core';
import { describe, expect, test } from 'vitest';

const WC_URL = process.env.ARC_WC_URL ?? 'http://localhost:8888';
const TEST_PRODUCT_ID = Number(process.env.TEST_PRODUCT_ID ?? '0');

describe('ARC-NEXT-02 — Cart-Token round-trip contract', () => {
  test.skipIf(!process.env.CI_WP_ENV)(
    'WC issues a Cart-Token on first write; a second client replaying it sees the same cart',
    async () => {
      let issuedToken: string | null = null;
      const writer = new WooClient({
        baseUrl: WC_URL,
        onCartToken: (token) => {
          issuedToken = token;
        },
      });

      // Establish the session first: a GET issues the Cart-Token + Nonce, which
      // the WooClient captures and replays so the subsequent write is authorized.
      await getCart(writer);
      await addItem(writer, { id: TEST_PRODUCT_ID, quantity: 1 });
      expect(typeof issuedToken).toBe('string');
      expect(issuedToken).toBeTruthy();

      // A second client replaying that token must resume the SAME cart.
      const reader = new WooClient({
        baseUrl: WC_URL,
        getCartToken: () => issuedToken,
      });
      const cart = await getCart(reader);
      expect(cart.items_count).toBeGreaterThanOrEqual(1);
    },
  );
});
