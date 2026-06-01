/**
 * WC Store API v1 — Cart module
 *
 * Pure typed functions over the WC Store API cart endpoints.
 * Each function accepts a `WooClient` instance and delegates all HTTP,
 * session, and Cart-Token logic to `client.request()`.
 *
 * No fetch calls, no header management, no cookie access in this file.
 */

import type { WooClient } from '../client/WooClient.js';
import type { WooCart } from '../types/woo.js';
import { safeValidateCart } from './validate.js';

// ---------------------------------------------------------------------------
// Payload types
// ---------------------------------------------------------------------------

export interface AddItemPayload {
  id: number;
  quantity: number;
  variation?: Array<{ attribute: string; value: string }>;
}

export interface UpdateItemPayload {
  key: string;
  quantity: number;
}

// ---------------------------------------------------------------------------
// Cart functions
// ---------------------------------------------------------------------------

/**
 * Returns the current cart for this WooClient session.
 * On first call the WooClient captures the Cart-Token from the response header automatically.
 */
export function getCart(client: WooClient): Promise<WooCart> {
  return client.request<WooCart>('/cart').then(safeValidateCart);
}

/**
 * Adds a product to the cart.
 * Supports simple products (id + quantity) and variable products (id + quantity + variation).
 */
export function addItem(client: WooClient, payload: AddItemPayload): Promise<WooCart> {
  return client
    .request<WooCart>('/cart/add-item', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    .then(safeValidateCart);
}

/**
 * Updates the quantity of a cart line item by key.
 */
export function updateItem(client: WooClient, payload: UpdateItemPayload): Promise<WooCart> {
  return client
    .request<WooCart>('/cart/update-item', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    .then(safeValidateCart);
}

/**
 * Removes a cart line item by key.
 */
export function removeItem(client: WooClient, payload: { key: string }): Promise<WooCart> {
  return client
    .request<WooCart>('/cart/remove-item', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    .then(safeValidateCart);
}

/**
 * Applies a coupon code to the cart.
 */
export async function applyCoupon(client: WooClient, payload: { code: string }): Promise<WooCart> {
  // POST /cart/coupons returns the added coupon resource, NOT the full cart —
  // re-fetch so callers get the updated cart (with the coupon + recalculated totals).
  await client.request('/cart/coupons', { method: 'POST', body: JSON.stringify(payload) });
  return getCart(client);
}

/**
 * Removes a coupon code from the cart.
 */
export async function removeCoupon(client: WooClient, code: string): Promise<WooCart> {
  await client.request(`/cart/coupons/${encodeURIComponent(code)}`, { method: 'DELETE' });
  return getCart(client);
}
