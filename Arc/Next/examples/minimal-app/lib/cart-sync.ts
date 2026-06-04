export const CART_UPDATED_EVENT = 'arc:cart-updated' as const;

/** Survives Suspense remounts when the layout badge resolves after client cart writes. */
let latestCartCount = 0;

export function readLatestCartCount(): number {
  return latestCartCount;
}

export function emitCartCount(count: number): void {
  latestCartCount = count;
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT, { detail: { count } }));
}
