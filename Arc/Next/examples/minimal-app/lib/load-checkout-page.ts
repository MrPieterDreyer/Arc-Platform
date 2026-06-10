import 'server-only';

import { getCart, getCheckoutSchema, type WooCart, type WCCheckoutResponse } from '@arc-platform/core';
import { createReadOnlyCartClient } from '@arc-platform/next/server';
import { connection } from 'next/server';

export type CheckoutPageModel =
  | { kind: 'empty' }
  | { kind: 'ready'; cart: WooCart; checkout: WCCheckoutResponse; wcCheckoutUrl: string }
  | { kind: 'error'; message: string };

export async function loadCheckoutPage(): Promise<CheckoutPageModel> {
  await connection();
  const wcUrl = process.env.ARC_WC_URL;
  if (!wcUrl) {
    return { kind: 'error', message: 'ARC_WC_URL is not configured.' };
  }

  try {
    const client = await createReadOnlyCartClient(wcUrl);
    const cart = await getCart(client);
    if (!cart.items_count || cart.items.length === 0) {
      return { kind: 'empty' };
    }

    const checkout = await getCheckoutSchema(client);
    const wcCheckoutUrl = `${wcUrl.replace(/\/+$/, '')}/checkout/`;

    return { kind: 'ready', cart, checkout, wcCheckoutUrl };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Could not load checkout for this session.';
    return { kind: 'error', message };
  }
}
