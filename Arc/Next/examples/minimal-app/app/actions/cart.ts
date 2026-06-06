'use server';

// A `'use server'` file may only export async functions — NOT re-exports.
// So we wrap @arc/next's server helpers in thin async Server Actions. These are
// what client components import and pass to form actions / event handlers.
import type { AddItemPayload, UpdateItemPayload } from '@arc/core';
import {
  addItemAction as addItem,
  removeItemAction as removeItem,
  updateItemAction as updateItem,
} from '@arc/next/server';

export async function addItemAction(payload: AddItemPayload) {
  return addItem(payload);
}

export async function updateItemAction(payload: UpdateItemPayload) {
  return updateItem(payload);
}

export async function removeItemAction(payload: { key: string }) {
  return removeItem(payload);
}

/** E2E-only: forces optimistic rollback (ARC-NEXT-07). */
export async function addItemActionFail(_payload: AddItemPayload): Promise<never> {
  throw new Error('E2E forced cart failure');
}
