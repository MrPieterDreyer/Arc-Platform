import 'server-only';

import {
  addItem,
  removeItem,
  updateItem,
  type AddItemPayload,
  type UpdateItemPayload,
  type WooCart,
} from '@arc/core';
import { createCartClient, refreshCartTokenCookie } from './cookies.js';

/**
 * Cart mutation helpers (`server-only`).
 *
 * These are deliberately NOT marked with the `'use server'` directive. A
 * published library cannot export Server Actions directly — Next.js binds the
 * `'use server'` boundary inside the *consuming app's* module graph. A
 * `'use server'` file may only export async functions (NOT re-exports), so
 * consumers WRAP these in thin async actions in their own `'use server'` module:
 *
 *   // app/_actions/cart.ts
 *   'use server';
 *   import { addItemAction as add } from '@arc/next/server';
 *   import type { AddItemPayload } from '@arc/core';
 *   export async function addItemAction(p: AddItemPayload) { return add(p); }
 *
 * The `server-only` import guarantees these never leak into a client bundle.
 * Each action throws on failure (no swallowing) so `useOptimisticCart` can roll
 * back the optimistic UI on the client.
 */

function resolveWcBaseUrl(baseUrl?: string): string {
  const url = baseUrl ?? process.env.ARC_WC_URL;
  if (!url) {
    throw new Error('ARC_WC_URL is required for cart actions');
  }
  return url;
}

/**
 * Add a line item via WC Store API, then refresh the Cart-Token cookie Max-Age.
 * Throws on failure (propagated from `@arc/core`) so `useOptimisticCart` can roll back.
 */
export async function addItemAction(payload: AddItemPayload, wcBaseUrl?: string): Promise<WooCart> {
  const client = await createCartClient(resolveWcBaseUrl(wcBaseUrl));
  const cart = await addItem(client, payload);
  await refreshCartTokenCookie();
  return cart;
}

export async function updateItemAction(
  payload: UpdateItemPayload,
  wcBaseUrl?: string,
): Promise<WooCart> {
  const client = await createCartClient(resolveWcBaseUrl(wcBaseUrl));
  const cart = await updateItem(client, payload);
  await refreshCartTokenCookie();
  return cart;
}

export async function removeItemAction(
  payload: { key: string },
  wcBaseUrl?: string,
): Promise<WooCart> {
  const client = await createCartClient(resolveWcBaseUrl(wcBaseUrl));
  const cart = await removeItem(client, payload);
  await refreshCartTokenCookie();
  return cart;
}

export function createCartActions(config: { wcBaseUrl: string }) {
  const { wcBaseUrl } = config;
  return {
    addItemAction: (payload: AddItemPayload) => addItemAction(payload, wcBaseUrl),
    updateItemAction: (payload: UpdateItemPayload) => updateItemAction(payload, wcBaseUrl),
    removeItemAction: (payload: { key: string }) => removeItemAction(payload, wcBaseUrl),
  } as const;
}
