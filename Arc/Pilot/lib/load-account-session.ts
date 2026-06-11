import 'server-only';

import { getCustomer, type WCCustomer } from '@arc-platform/core';
import { createReadOnlyCartClient } from '@arc-platform/next/server';
import { connection } from 'next/server';

export type AccountSessionModel =
  | { kind: 'error'; message: string }
  | { kind: 'ready'; customer: WCCustomer };

/**
 * Session-scoped account surface — billing/shipping from the cart session (Store API).
 * Not a logged-in customer profile; see ADR-0009 for full auth.
 */
export async function loadAccountSession(): Promise<AccountSessionModel> {
  await connection();
  const wcUrl = process.env.ARC_WC_URL;
  if (!wcUrl) {
    return { kind: 'error', message: 'ARC_WC_URL is not configured.' };
  }

  try {
    const client = await createReadOnlyCartClient(wcUrl);
    const customer = await getCustomer(client);
    return { kind: 'ready', customer };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load session account data.';
    return { kind: 'error', message };
  }
}
