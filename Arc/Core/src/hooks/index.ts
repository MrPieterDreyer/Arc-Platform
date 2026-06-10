// `client-only` is the enforced client boundary for this barrel: importing it
// from a Server Component throws at build time with a clear message instead of a
// cryptic "useEffect in a Server Component" error. (A `'use client'` directive
// is stripped by the bundler here, so `client-only` is the reliable guard.)
import 'client-only';

/**
 * @arc-platform/core/hooks — React 19 Client Component hooks.
 *
 * Deliberately a SEPARATE entry from the main `@arc-platform/core` barrel so the root
 * stays React-Server-Component-safe. The main barrel is imported server-side
 * (loaders, Server Actions, route handlers via `@arc-platform/next`); if it re-exported
 * these hooks, `useEffect`/`useOptimistic`/`useSyncExternalStore` would be
 * pulled into a Server Component and the Next.js build would fail with
 * "This API is only available in Client Components".
 *
 * Import these ONLY from Client Components:  import { useCart } from '@arc-platform/core/hooks'
 */
export type { CartActions, CartSnapshot, CartState } from './useCart.js';
export { getOrCreateCartStore, useCart } from './useCart.js';
export type { CollectionState } from './useCollection.js';
export { useCollection } from './useCollection.js';
export type { CustomerState } from './useCustomer.js';
export { useCustomer } from './useCustomer.js';
export type { ProductState } from './useProduct.js';
export { useProduct } from './useProduct.js';
export type { SearchState } from './useSearch.js';
export { useSearch } from './useSearch.js';
