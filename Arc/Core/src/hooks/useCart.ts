/**
 * useCart — React 19 hook for WooCommerce cart state.
 *
 * Uses useSyncExternalStore for shared reactive state across all consumers
 * of the same WooClient instance (WeakMap singleton per client).
 * Uses useOptimistic for optimistic UI updates before network round-trips.
 *
 * Client Component only — do NOT import in Server Components.
 * No next/* imports — framework-agnostic.
 */
import { useCallback, useOptimistic, useSyncExternalStore } from 'react';
import type { WooClient } from '../client/WooClient.js';
import type { AddItemPayload, UpdateItemPayload } from '../store-api/cart.js';
import {
  addItem,
  applyCoupon,
  getCart,
  removeCoupon,
  removeItem,
  updateItem,
} from '../store-api/cart.js';
import type { WooCart, WooCartItem } from '../types/woo.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CartSnapshot {
  cart: WooCart | null;
  loading: boolean;
}

export interface CartActions {
  refresh(): Promise<void>;
  addItem(payload: AddItemPayload): Promise<void>;
  updateItem(payload: UpdateItemPayload): Promise<void>;
  removeItem(key: string): Promise<void>;
  applyCoupon(code: string): Promise<void>;
  removeCoupon(code: string): Promise<void>;
}

export type CartState = CartSnapshot & CartActions;

type OptimisticAction =
  | { type: 'add'; productId: number; quantity: number }
  | { type: 'remove'; key: string }
  | { type: 'update'; key: string; quantity: number };

// ---------------------------------------------------------------------------
// CartStore — one per WooClient instance, held in a WeakMap
// ---------------------------------------------------------------------------

class CartStore {
  private listeners = new Set<() => void>();
  private _cart: WooCart | null = null;
  private _loading = false;
  /** Cached snapshot — stable reference required by useSyncExternalStore. */
  private _snapshot: CartSnapshot = { cart: null, loading: false };
  /** SSR snapshot — constant, never changes. */
  private readonly _serverSnapshot: CartSnapshot = { cart: null, loading: false };

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getSnapshot(): CartSnapshot {
    return this._snapshot;
  }

  /** SSR-safe snapshot — always returns an empty, non-loading state. */
  getServerSnapshot(): CartSnapshot {
    return this._serverSnapshot;
  }

  private notify(): void {
    // Create a new snapshot object so useSyncExternalStore detects the change.
    this._snapshot = { cart: this._cart, loading: this._loading };
    for (const l of this.listeners) l();
  }

  setCart(cart: WooCart): void {
    this._cart = cart;
    this.notify();
  }

  async refresh(client: WooClient): Promise<void> {
    this._loading = true;
    this.notify();
    try {
      this._cart = await getCart(client);
    } finally {
      this._loading = false;
      this.notify();
    }
  }

  async mutate(client: WooClient, fn: () => Promise<WooCart>): Promise<void> {
    try {
      const cart = await fn();
      this._cart = cart;
    } finally {
      this.notify();
    }
  }
}

// Module-level WeakMap — one CartStore per WooClient instance.
const storeMap = new WeakMap<WooClient, CartStore>();

/** Returns the shared CartStore for a given WooClient. Exported for tests. */
export function getOrCreateCartStore(client: WooClient): CartStore {
  let store = storeMap.get(client);
  if (!store) {
    store = new CartStore();
    storeMap.set(client, store);
  }
  return store;
}

// ---------------------------------------------------------------------------
// Optimistic reducer
// ---------------------------------------------------------------------------

function optimisticReducer(current: WooCart | null, action: OptimisticAction): WooCart | null {
  if (!current) return current;
  const cart = { ...current, items: [...current.items] };

  if (action.type === 'add') {
    cart.item_count = (cart.item_count ?? 0) + action.quantity;
    return cart;
  }
  if (action.type === 'remove') {
    const item = cart.items.find((i: WooCartItem) => i.key === action.key);
    const qty = item?.quantity ?? 1;
    cart.items = cart.items.filter((i: WooCartItem) => i.key !== action.key);
    cart.item_count = Math.max(0, (cart.item_count ?? 0) - qty);
    return cart;
  }
  if (action.type === 'update') {
    cart.items = cart.items.map((i: WooCartItem) =>
      i.key === action.key ? { ...i, quantity: action.quantity } : i,
    );
    return cart;
  }
  return current;
}

// ---------------------------------------------------------------------------
// useCart hook
// ---------------------------------------------------------------------------

export function useCart(client: WooClient): CartState {
  const store = getOrCreateCartStore(client);
  const snapshot = useSyncExternalStore(
    store.subscribe.bind(store),
    store.getSnapshot.bind(store),
    store.getServerSnapshot.bind(store),
  );

  // useOptimistic wraps the real cart with an optimistic layer.
  const [optimisticCart, dispatchOptimistic] = useOptimistic(snapshot.cart, optimisticReducer);

  const refresh = useCallback(() => store.refresh(client), [store, client]);

  const add = useCallback(
    async (payload: AddItemPayload) => {
      dispatchOptimistic({ type: 'add', productId: payload.id, quantity: payload.quantity });
      await store.mutate(client, () => addItem(client, payload));
    },
    [store, client, dispatchOptimistic],
  );

  const update = useCallback(
    async (payload: UpdateItemPayload) => {
      dispatchOptimistic({ type: 'update', key: payload.key, quantity: payload.quantity });
      await store.mutate(client, () => updateItem(client, payload));
    },
    [store, client, dispatchOptimistic],
  );

  const remove = useCallback(
    async (key: string) => {
      dispatchOptimistic({ type: 'remove', key });
      await store.mutate(client, () => removeItem(client, { key }));
    },
    [store, client, dispatchOptimistic],
  );

  const applyC = useCallback(
    (code: string) => store.mutate(client, () => applyCoupon(client, { code })),
    [store, client],
  );

  const removeC = useCallback(
    (code: string) => store.mutate(client, () => removeCoupon(client, code)),
    [store, client],
  );

  return {
    cart: optimisticCart,
    loading: snapshot.loading,
    refresh,
    addItem: add,
    updateItem: update,
    removeItem: remove,
    applyCoupon: applyC,
    removeCoupon: removeC,
  };
}
