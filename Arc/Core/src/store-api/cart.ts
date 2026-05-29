/**
 * WC Store API v1 — Cart module
 *
 * Pure typed functions over the WC Store API cart endpoints.
 * Each function accepts a `WooClient` instance and delegates all HTTP,
 * session, and Cart-Token logic to `client.request()`.
 *
 * No fetch calls, no header management, no cookie access in this file.
 */

import type { WooCart } from '../types/woo.js';
import { WooClient } from '../client/WooClient.js';

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
  return client.request<WooCart>('/cart');
}

/**
 * Adds a product to the cart.
 * Supports simple products (id + quantity) and variable products (id + quantity + variation).
 */
export function addItem(client: WooClient, payload: AddItemPayload): Promise<WooCart> {
  return client.request<WooCart>('/cart/add-item', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Updates the quantity of a cart line item by key.
 */
export function updateItem(client: WooClient, payload: UpdateItemPayload): Promise<WooCart> {
  return client.request<WooCart>('/cart/update-item', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Removes a cart line item by key.
 */
export function removeItem(client: WooClient, payload: { key: string }): Promise<WooCart> {
  return client.request<WooCart>('/cart/remove-item', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Applies a coupon code to the cart.
 */
export function applyCoupon(client: WooClient, payload: { code: string }): Promise<WooCart> {
  return client.request<WooCart>('/cart/coupons', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Removes a coupon code from the cart.
 */
export function removeCoupon(client: WooClient, code: string): Promise<WooCart> {
  return client.request<WooCart>(`/cart/coupons/${encodeURIComponent(code)}`, {
    method: 'DELETE',
  });
}
