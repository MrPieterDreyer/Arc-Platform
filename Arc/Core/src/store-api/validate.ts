/**
 * WC Store API — defensive runtime validation
 *
 * The WC Store API has no published JSON schema, so the TypeScript types in
 * `types/woo.ts` are hand-authored from the WC source. To catch drift between
 * those hand-authored types and what a live store actually returns, we run a
 * cheap structural check on responses.
 *
 * Design constraints:
 * - NEVER throws in production. `safeParse` + return-the-raw-value means a
 *   shape mismatch can never break a storefront — it only surfaces a warning
 *   in development so the maintainer notices and tightens the types.
 * - `.passthrough()` everywhere: we assert the load-bearing invariants only,
 *   not an exhaustive field list, so additive WC changes don't false-positive.
 */

import { z } from 'zod';
import type { WooCart } from '../types/woo.js';

/** Load-bearing structural invariants of a WC Store API cart response. */
const CartShape = z
  .object({
    items: z.array(z.unknown()),
    items_count: z.number(),
    totals: z
      .object({
        total_price: z.string(),
        currency_code: z.string(),
      })
      .passthrough(),
  })
  .passthrough();

/**
 * Validates a cart response structurally. On mismatch, warns once per distinct
 * issue signature in non-production environments and returns the value
 * unchanged. Returns the input verbatim — this is a pass-through guard, not a
 * transform.
 */
const seenWarnings = new Set<string>();

export function safeValidateCart(value: WooCart): WooCart {
  const result = CartShape.safeParse(value);
  if (!result.success && process.env.NODE_ENV !== 'production') {
    const signature = result.error.issues.map((i) => `${i.path.join('.')}:${i.code}`).join('|');
    if (!seenWarnings.has(signature)) {
      seenWarnings.add(signature);
      console.warn(
        '[@arc-platform/core] Cart response failed structural validation — the WC Store API ' +
          'shape may have drifted from the hand-authored types. Issues:',
        result.error.issues,
      );
    }
  }
  return value;
}

/** Test-only: reset the warn-once de-duplication cache. */
export function __resetCartValidationWarnings(): void {
  seenWarnings.clear();
}
