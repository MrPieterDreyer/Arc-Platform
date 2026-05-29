/**
 * Cart API — Contract Tests (ARC-API-04)
 *
 * These tests exercise all 6 cart functions against a real WooCommerce wp-env instance.
 * All tests are gated behind CI_WP_ENV=true to prevent accidental execution in unit
 * test runs where no WordPress instance is available.
 *
 * Prerequisites (CI / local manual run):
 *   - `@wordpress/env` started (wp-env start)
 *   - WP_URL set to the wp-env URL (default: http://localhost:8888)
 *   - TEST_PRODUCT_ID set to a seeded product ID (default: '1')
 *   - TEST_COUPON_CODE set to a seeded coupon code (default: 'TEST10')
 *   - CI_WP_ENV=true to enable the tests
 */

import { describe, test, beforeEach, expect } from 'vitest';
import { WooClient } from '../../client/WooClient.js';
import {
  getCart,
  addItem,
  removeItem,
  updateItem,
  applyCoupon,
  removeCoupon,
} from '../../store-api/cart.js';

// ---------------------------------------------------------------------------
// Shared client — one session per test file
// ---------------------------------------------------------------------------

const client = new WooClient({
  baseUrl: process.env['WP_URL'] ?? 'http://localhost:8888',
});

// ---------------------------------------------------------------------------
// Helper: clear the cart before each test
// ---------------------------------------------------------------------------

async function clearCart(): Promise<void> {
  const cart = await getCart(client);
  for (const item of cart.items) {
    await removeItem(client, { key: item.key });
  }
}

// ---------------------------------------------------------------------------
// Cart API — ARC-API-04
// ---------------------------------------------------------------------------

describe('Cart API — ARC-API-04', () => {
  beforeEach(async () => {
    await clearCart();
  });

  test.skipIf(!process.env['CI_WP_ENV'])(
    'getCart — returns cart with items array, totals object, and item_count number',
    async () => {
      const cart = await getCart(client);

      expect(Array.isArray(cart.items)).toBe(true);
      expect(cart.totals).toBeDefined();
      expect(typeof cart.item_count).toBe('number');
    },
  );

  test.skipIf(!process.env['CI_WP_ENV'])(
    'addItem — adds a product, returns cart with items_count >= 1 and matching item id',
    async () => {
      const productId = Number(process.env['TEST_PRODUCT_ID'] ?? '1');
      const cart = await addItem(client, { id: productId, quantity: 1 });

      expect(cart.item_count).toBeGreaterThanOrEqual(1);
      const added = cart.items.find((item) => item.id === productId);
      expect(added).toBeDefined();
    },
  );

  test.skipIf(!process.env['CI_WP_ENV'])(
    'updateItem — updates quantity of first cart item to 2',
    async () => {
      const productId = Number(process.env['TEST_PRODUCT_ID'] ?? '1');
      const cartWithItem = await addItem(client, { id: productId, quantity: 1 });
      const firstItem = cartWithItem.items[0];
      expect(firstItem).toBeDefined();

      const updated = await updateItem(client, { key: firstItem.key, quantity: 2 });
      const updatedItem = updated.items.find((item) => item.key === firstItem.key);
      expect(updatedItem?.quantity).toBe(2);
    },
  );

  test.skipIf(!process.env['CI_WP_ENV'])(
    'removeItem — removes first cart item, decreasing item_count by 1',
    async () => {
      const productId = Number(process.env['TEST_PRODUCT_ID'] ?? '1');
      const cartWithItem = await addItem(client, { id: productId, quantity: 1 });
      const countBefore = cartWithItem.item_count;
      const firstItem = cartWithItem.items[0];
      expect(firstItem).toBeDefined();

      const updated = await removeItem(client, { key: firstItem.key });
      expect(updated.item_count).toBe(countBefore - 1);
    },
  );

  test.skipIf(!process.env['CI_WP_ENV'])(
    'applyCoupon — applies coupon, returns cart with coupons array length >= 1',
    async () => {
      const couponCode = process.env['TEST_COUPON_CODE'] ?? 'TEST10';
      const cart = await applyCoupon(client, { code: couponCode });

      expect(cart.coupons.length).toBeGreaterThanOrEqual(1);
    },
  );

  test.skipIf(!process.env['CI_WP_ENV'])(
    'removeCoupon — applies then removes coupon, returns cart with empty coupons array',
    async () => {
      const couponCode = process.env['TEST_COUPON_CODE'] ?? 'TEST10';
      await applyCoupon(client, { code: couponCode });
      const cart = await removeCoupon(client, couponCode);

      expect(cart.coupons).toHaveLength(0);
    },
  );
});
