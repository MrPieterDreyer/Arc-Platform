'use server';

// A `'use server'` file may only export async functions — NOT re-exports.
// So we wrap @arc/next's server helpers in thin async Server Actions. These are
// what client components import and pass to form actions / event handlers.
import type { AddItemPayload } from '@arc/core';
import { addItemAction as addItem } from '@arc/next/server';

export async function addItemAction(payload: AddItemPayload) {
  return addItem(payload);
}
