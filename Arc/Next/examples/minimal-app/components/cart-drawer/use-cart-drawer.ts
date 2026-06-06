'use client';

import type { WooCart } from '@arc/core';
import { useOptimistic, useTransition } from 'react';
import { removeItemAction, updateItemAction } from '../../app/actions/cart';
import { emitCartCount } from '../../lib/cart-sync';

// ---------------------------------------------------------------------------
// Optimistic reducer helpers
// ---------------------------------------------------------------------------

type CartAction =
  | { type: 'update'; key: string; quantity: number }
  | { type: 'remove'; key: string };

function applyOptimistic(cart: WooCart | null, action: CartAction): WooCart | null {
  if (!cart) return cart;

  if (action.type === 'remove') {
    const items = cart.items.filter((i) => i.key !== action.key);
    return {
      ...cart,
      items,
      items_count: items.reduce((sum, i) => sum + i.quantity, 0),
    };
  }

  if (action.type === 'update') {
    const items = cart.items.map((i) =>
      i.key === action.key ? { ...i, quantity: action.quantity } : i,
    );
    return {
      ...cart,
      items,
      items_count: items.reduce((sum, i) => sum + i.quantity, 0),
    };
  }

  return cart;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseCartDrawerOptions {
  cart: WooCart | null;
  onCartUpdate: (cart: WooCart) => void;
  errorLabel?: string;
}

export function useCartDrawer({ cart, onCartUpdate, errorLabel }: UseCartDrawerOptions) {
  const [isPending, startTransition] = useTransition();
  const [optimisticCart, dispatchOptimistic] = useOptimistic(cart, applyOptimistic);

  const defaultError = errorLabel ?? "We couldn't update your cart. Try again.";

  function update(key: string, quantity: number): Promise<void> {
    return new Promise((resolve, reject) => {
      startTransition(async () => {
        dispatchOptimistic({ type: 'update', key, quantity });
        try {
          const next = await updateItemAction({ key, quantity });
          onCartUpdate(next);
          emitCartCount(next.items_count ?? 0);
          resolve();
        } catch (err) {
          reject(err instanceof Error ? err : new Error(defaultError));
        }
      });
    });
  }

  function remove(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      startTransition(async () => {
        dispatchOptimistic({ type: 'remove', key });
        try {
          const next = await removeItemAction({ key });
          onCartUpdate(next);
          emitCartCount(next.items_count ?? 0);
          resolve();
        } catch (err) {
          reject(err instanceof Error ? err : new Error(defaultError));
        }
      });
    });
  }

  return {
    optimisticCart,
    isPending,
    update,
    remove,
    errorLabel: defaultError,
  } as const;
}
