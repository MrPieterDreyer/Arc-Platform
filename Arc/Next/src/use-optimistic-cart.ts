'use client';

import 'client-only';

import type { WooCart } from '@arc/core';
import { useOptimistic, useTransition } from 'react';

export type AddItemAction = (payload: { id: number; quantity: number }) => Promise<WooCart>;

/**
 * Optimistic cart count for Server Actions that throw on error (ARC-NEXT-07).
 * Pair with `addItemAction` from `@arc/next/server` in a consumer `app/actions/cart.ts`.
 */
export function useOptimisticCart(cart: WooCart | null, addItemAction: AddItemAction) {
  const [isPending, startTransition] = useTransition();
  const [optimisticCart, addOptimistic] = useOptimistic(
    cart,
    (state: WooCart | null, delta: number) => {
      if (!state) return state;
      return { ...state, items_count: (state.items_count ?? 0) + delta };
    },
  );

  function add(id: number, quantity: number): Promise<void> {
    return new Promise((resolve, reject) => {
      startTransition(async () => {
        try {
          addOptimistic(quantity);
          await addItemAction({ id, quantity });
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  return {
    cart: optimisticCart,
    add,
    isPending,
    pendingLabel: 'Updating cart…' as const,
    errorLabel: 'Could not update your cart. Please try again.' as const,
  } as const;
}
