import 'server-only';

import { getCart } from '@arc/core';
import { createReadOnlyCartClient } from '@arc/next/server';
import { connection } from 'next/server';

function wcRequestTimeoutMs(): number {
  const raw = process.env.ARC_WC_TIMEOUT_MS;
  if (raw) {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return 30_000;
}

/** Server-only cart count for layout badge (read-only cookie). */
export async function readCartItemCount(): Promise<number> {
  await connection();
  const wcUrl = process.env.ARC_WC_URL;
  if (!wcUrl) return 0;
  try {
    const client = await createReadOnlyCartClient(wcUrl, { timeout: wcRequestTimeoutMs() });
    const cart = await getCart(client);
    return cart.items_count ?? 0;
  } catch {
    return 0;
  }
}
