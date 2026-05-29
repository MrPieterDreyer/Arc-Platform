---
phase: 01-arc-core
plan: 09
subsystem: ui
tags: [react, react-19, hooks, useSyncExternalStore, useOptimistic, cart, graphql, testing-library]

requires:
  - phase: 01-arc-core plan 02
    provides: store-api/cart.ts (getCart, addItem, updateItem, removeItem, applyCoupon, removeCoupon)
  - phase: 01-arc-core plan 04
    provides: graphql/products.ts (getProduct, getProducts)
  - phase: 01-arc-core plan 05
    provides: graphql/collections.ts + graphql/search.ts
  - phase: 01-arc-core plan 07
    provides: store-api/customer.ts + graphql/customer.ts

provides:
  - useCart hook — WeakMap CartStore + useSyncExternalStore + useOptimistic pattern
  - useProduct hook — single product fetch with variation state
  - useCollection hook — collection + cursor-paginated products via loadMore()
  - useCustomer hook — session-scoped address + optional GQL order history
  - useSearch hook — debounced search with plain setTimeout (300ms default)
  - All 5 hooks exported from @arc/core barrel (index.ts)

affects:
  - 02-arc-next (will consume hooks in Next.js integration layer)
  - LOFT Pro Shop (customer-zero consumer of all 5 hooks)

tech-stack:
  added:
    - "@testing-library/react ^16.3.2"
    - "@testing-library/jest-dom ^6.9.1"
    - "@types/react ^19.2.15"
    - "react catalog: (devDep + peerDep >=19)"
    - "react-dom catalog: (devDep)"
  patterns:
    - WeakMap CartStore singleton — one store per WooClient instance, no Provider required
    - useSyncExternalStore with stable cached snapshot reference (avoids React infinite loop)
    - useOptimistic for cart mutations — UI updates before network round-trip
    - Cancellation flag pattern in useEffect (prevents state updates on unmounted components)
    - Plain setTimeout/clearTimeout debounce in useSearch — no external debounce library
    - environmentMatchGlobs in vitest.config.ts — jsdom only for hooks.test.ts, node elsewhere

key-files:
  created:
    - Arc/Core/src/hooks/useCart.ts
    - Arc/Core/src/hooks/useProduct.ts
    - Arc/Core/src/hooks/useCollection.ts
    - Arc/Core/src/hooks/useCustomer.ts
    - Arc/Core/src/hooks/useSearch.ts
    - Arc/Core/src/__tests__/unit/hooks.test.ts
  modified:
    - Arc/Core/src/index.ts (hook exports appended)
    - Arc/Core/vitest.config.ts (environmentMatchGlobs + setupFiles)
    - Arc/Core/package.json (react peerDep + testing devDeps)

key-decisions:
  - "useCart uses WooCart from types/woo.ts (not WCCart from types/cart.ts) — matches what store-api/cart.ts actually returns; WCCart has shipping_rates typed as WCShippingPackage[] while WooCart uses unknown[]"
  - "CartStore.getSnapshot() returns a cached _snapshot object — required by React useSyncExternalStore Object.is stability check to avoid infinite re-render"
  - "environmentMatchGlobs used instead of top-level environment: 'jsdom' — keeps all non-hook tests on node environment"
  - "getOrCreateCartStore() exported for testing — allows direct CartStore access without rendering hooks"
  - "useOptimistic reducer uses item_count (WooCart field) not items_count — discovered via TypeScript DTS build error"

patterns-established:
  - "WeakMap store pattern: const storeMap = new WeakMap<WooClient, CartStore>() — one store per client, GC-safe, no Provider boilerplate"
  - "Stable snapshot cache: _snapshot field updated only in notify() — satisfies useSyncExternalStore Object.is stability requirement"
  - "Cancellation flag: let cancelled = false; return () => { cancelled = true; } — used in useProduct, useCollection, useCustomer"

requirements-completed:
  - ARC-HOOK-01
  - ARC-HOOK-02
  - ARC-HOOK-03
  - ARC-HOOK-04
  - ARC-HOOK-05

duration: 18min
completed: 2026-05-29
---

# Phase 01 Plan 09: React 19 Hooks Layer Summary

**Five framework-agnostic React 19 hooks (useCart/useProduct/useCollection/useCustomer/useSearch) using WeakMap CartStore + useSyncExternalStore + useOptimistic — the developer-facing API surface of @arc/core**

## Performance

- **Duration:** ~18 min
- **Started:** 2026-05-29T12:19:45Z
- **Completed:** 2026-05-29T12:26:00Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Implemented all 5 hooks with correct React 19 primitives — `useSyncExternalStore` for shared cart state, `useOptimistic` for optimistic mutations, `useState`+`useEffect` with cancellation flags for the remaining 4
- CartStore WeakMap singleton confirmed working — two consumers of the same WooClient instance share reactive state without a Provider, verified by unit test
- All 11 unit tests pass (3 for ARC-HOOK-01, 2 for ARC-HOOK-02, 1 for ARC-HOOK-03, 2 for ARC-HOOK-04, 3 for ARC-HOOK-05)
- Build exits 0 with all 5 hooks + type exports in `dist/index.d.ts`
- Zero `next/*` imports in any hook file; zero `'use client'`/`'use server'` directives

## Task Commits

1. **Task 1: useCart hook + testing infrastructure** — `c2f9af9` (feat)
2. **Task 2: useProduct, useCollection, useCustomer, useSearch + barrel exports** — `1446ebe` (feat)

## Files Created/Modified

- `Arc/Core/src/hooks/useCart.ts` — CartStore class + WeakMap singleton + useSyncExternalStore + useOptimistic
- `Arc/Core/src/hooks/useProduct.ts` — useState+useEffect, cancellation flag, selectedVariation state
- `Arc/Core/src/hooks/useCollection.ts` — parallel fetch (collection+products), loadMore() cursor pagination
- `Arc/Core/src/hooks/useCustomer.ts` — session Store API + optional GQL order history via gqlClient param
- `Arc/Core/src/hooks/useSearch.ts` — debounced search, plain setTimeout/clearTimeout, no external lib
- `Arc/Core/src/__tests__/unit/hooks.test.ts` — 11 passing tests covering all 5 hooks
- `Arc/Core/src/index.ts` — hook exports appended to barrel
- `Arc/Core/vitest.config.ts` — environmentMatchGlobs + setupFiles for jest-dom
- `Arc/Core/package.json` — react peerDep (>=19) + testing devDeps added

## Decisions Made

- **WooCart vs WCCart:** Used `WooCart` from `types/woo.ts` in `useCart.ts` because `store-api/cart.ts` functions return `WooCart`. The `WCCart` type has `shipping_rates: WCShippingPackage[]` but `WooCart` uses `unknown[]` — using `WCCart` caused DTS build errors.
- **CartStore snapshot caching:** `getSnapshot()` must return a stable object reference. React's `useSyncExternalStore` uses `Object.is` comparison — returning a fresh object every call triggered infinite re-renders.
- **environmentMatchGlobs:** Scoped jsdom environment to only `hooks.test.ts` — other test files run in node for correctness.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] getSnapshot() returned new object on every call causing React infinite loop**
- **Found during:** Task 1 (useCart hook rendering in jsdom tests)
- **Issue:** React's `useSyncExternalStore` calls `getSnapshot()` frequently using `Object.is` to detect changes. Returning a new object literal `{ cart: this._cart, loading: this._loading }` on every call caused infinite re-renders.
- **Fix:** Added `_snapshot` field to CartStore updated only in `notify()`. `getSnapshot()` returns `this._snapshot` — stable until a mutation fires.
- **Files modified:** `Arc/Core/src/hooks/useCart.ts`
- **Committed in:** `c2f9af9`

**2. [Rule 1 - Bug] WooCart.item_count used instead of items_count**
- **Found during:** Task 1 (DTS build errors)
- **Issue:** Initial `useCart.ts` used `items_count` but `WooCart` type defines `item_count`. TypeScript DTS build produced 4 type errors.
- **Fix:** Fixed field name to `item_count` in `optimisticReducer` and updated test fixtures.
- **Files modified:** `Arc/Core/src/hooks/useCart.ts`, `Arc/Core/src/__tests__/unit/hooks.test.ts`
- **Committed in:** `c2f9af9`

**3. [Rule 2 - Missing Critical] @types/react required for DTS build**
- **Found during:** Task 1 (DTS build — "Could not find declaration file for module 'react'")
- **Issue:** `useCart.ts` imports from `'react'` but `@types/react` was not in devDependencies.
- **Fix:** `pnpm --filter @arc/core add -D @types/react`
- **Files modified:** `Arc/Core/package.json`
- **Committed in:** `c2f9af9`

---

**Total deviations:** 3 auto-fixed (2 Rule 1 bugs, 1 Rule 2 missing critical)
**Impact on plan:** All necessary for correctness. No scope creep.

## Issues Encountered

None beyond the auto-fixed deviations above.

## Known Stubs

None — all 5 hooks fetch real data from their respective domain modules with no hardcoded fixtures or placeholder data.

## Next Phase Readiness

- All 5 hooks exported from `@arc/core` barrel — LOFT Pro Shop can import `useCart`, `useProduct`, `useCollection`, `useCustomer`, `useSearch` directly
- Phase 01 (arc-core) is functionally complete: HTTP client, Store API functions, GraphQL functions, and React hooks all implemented and tested
- Phase 02 (arc-next) can proceed: it will wrap Next.js-specific patterns (`cookies()`, `headers()`, `cacheTag`) in a separate package, consuming `@arc/core` hooks

---

*Phase: 01-arc-core*
*Completed: 2026-05-29*
