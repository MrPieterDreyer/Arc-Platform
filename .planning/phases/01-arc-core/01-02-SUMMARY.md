---
phase: 1
plan: 02
subsystem: arc-core
tags: [store-api, cart, woo-client, contract-tests, typescript, vitest]
dependency_graph:
  requires: [01-01-woo-client]
  provides: [cart-module, cart-contract-tests]
  affects: [01-03-checkout, 01-04-customer, 01-05-search, 01-06-orders]
tech_stack:
  added: []
  patterns:
    - "Pure function cart module — each function accepts WooClient, delegates HTTP to client.request()"
    - "Contract test gate — test.skipIf(!process.env.CI_WP_ENV) for all integration tests"
    - "*.contract.ts naming convention — vitest include pattern extended to pick them up"
key_files:
  created:
    - Arc/Core/src/store-api/cart.ts
    - Arc/Core/src/__tests__/contract/cart.contract.ts
  modified:
    - Arc/Core/src/index.ts
    - Arc/Core/vitest.config.ts
decisions:
  - "cart.ts functions use client.request() directly — no WooClient cart method delegation, no fetch/session logic"
  - "removeItem uses POST /cart/remove-item (not DELETE) — matches WC Store API v1 spec"
  - "vitest include pattern extended to *.contract.ts — contract tests stay separate from unit tests"
metrics:
  duration: "~3m"
  completed_date: "2026-05-29"
  tasks_completed: 2
  files_created: 2
  files_modified: 2
---

# Phase 1 Plan 02: Cart Module — Store API Functions + Contract Tests Summary

**One-liner:** 6 typed WC Store API cart functions as pure function wrappers over `WooClient.request()`, plus `CI_WP_ENV`-gated Vitest contract tests covering the full cart lifecycle.

---

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Cart module implementation | `fbbebf5` | `Arc/Core/src/store-api/cart.ts`, `Arc/Core/src/index.ts` |
| 2 | Cart contract tests | `d7c72ee` | `Arc/Core/src/__tests__/contract/cart.contract.ts`, `Arc/Core/vitest.config.ts` |

---

## What Was Built

### `Arc/Core/src/store-api/cart.ts`

Pure typed functions over the WC Store API v1 cart surface:
- `getCart(client)` — GET /cart, returns `Promise<WooCart>`
- `addItem(client, payload)` — POST /cart/add-item, accepts `AddItemPayload` (id, quantity, variation?)
- `updateItem(client, payload)` — POST /cart/update-item, accepts `UpdateItemPayload` (key, quantity)
- `removeItem(client, payload)` — POST /cart/remove-item, accepts `{ key: string }`
- `applyCoupon(client, payload)` — POST /cart/coupons, accepts `{ code: string }`
- `removeCoupon(client, code)` — DELETE /cart/coupons/{encoded_code}

Zero fetch calls, zero session logic, zero header management — all of that lives in `WooClient.request()`.
No `any` in any exported type or function signature.

### `Arc/Core/src/__tests__/contract/cart.contract.ts`

6 contract tests under `describe('Cart API — ARC-API-04', ...)`:
1. `getCart` — asserts response shape (items array, totals, item_count)
2. `addItem` — adds seeded product, asserts item_count >= 1 and item.id match
3. `updateItem` — updates first item to qty 2, asserts quantity on returned item
4. `removeItem` — removes first item, asserts item_count decreases by 1
5. `applyCoupon` — applies seeded coupon, asserts coupons.length >= 1
6. `removeCoupon` — applies then removes coupon, asserts coupons is empty

Each test gated with `test.skipIf(!process.env.CI_WP_ENV)`. `beforeEach` clears the cart for isolation.

### Verification

```
$ npx tsup
ESM  dist/index.mjs     7.30 KB
CJS  dist/index.js      7.55 KB
DTS  dist/index.d.ts    10.63 KB
Build success

$ npx vitest run
 Test Files  3 passed | 1 skipped (4)
       Tests  32 passed | 6 skipped (38)
   Duration  263ms
```

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] vitest.config.ts include pattern missing *.contract.ts**
- **Found during:** Task 2 — running contract tests returned "No test files found"
- **Issue:** vitest `include` only had `src/**/*.test.ts` — contract tests use `.contract.ts` extension
- **Fix:** Extended include to `['src/**/*.test.ts', 'src/**/*.contract.ts']`
- **Files modified:** `Arc/Core/vitest.config.ts`
- **Commit:** `d7c72ee`

**2. [Rule 1 - Adaptation] Actual WooClient.request() signature differs from plan context**
- **Found during:** Task 1 implementation
- **Issue:** Plan's `<interfaces>` section showed `request<T>(method, path, options)` (3-arg) but the actual WooClient built in 01-01 uses `request<T>(path, init?)` (2-arg, init is standard `RequestInit`)
- **Fix:** Used actual 2-arg signature with `method` inside `init` object (e.g., `{ method: 'POST', body: JSON.stringify(payload) }`)
- **Files modified:** `Arc/Core/src/store-api/cart.ts`
- No additional commit needed — handled during Task 1 implementation

**3. [Rule 1 - Adaptation] WCCart type alias — plan uses WCCart, actual type is WooCart**
- **Found during:** Task 1 implementation
- **Issue:** Plan referenced `WCCart` from `'../types/cart.js'` but 01-01 built `WooCart` in `'../types/woo.js'` (no separate cart.ts type file)
- **Fix:** Used `WooCart` from `'../types/woo.js'` — same structural shape, different name
- **Files modified:** `Arc/Core/src/store-api/cart.ts`

---

## Known Stubs

None. All 6 cart functions are fully implemented. Contract tests are intentionally `skipIf`-gated — not stubs.

---

## Self-Check: PASSED

Files verified:
- `Arc/Core/src/store-api/cart.ts` — FOUND
- `Arc/Core/src/__tests__/contract/cart.contract.ts` — FOUND
- `Arc/Core/src/index.ts` contains `getCart` export — VERIFIED
- `Arc/Core/dist/index.d.ts` contains all 6 function signatures — VERIFIED

Commits verified:
- `fbbebf5` — feat(01-02): add cart module — 6 typed Store API cart functions
- `d7c72ee` — test(01-02): add cart contract tests gated on CI_WP_ENV
