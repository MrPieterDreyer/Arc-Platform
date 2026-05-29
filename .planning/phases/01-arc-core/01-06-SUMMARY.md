---
phase: 1
plan: 06
subsystem: arc-core
tags: [store-api, orders, woo-client, typescript-types, contract-tests, session-isolation]
dependency_graph:
  requires: [01-01-woo-client]
  provides: [getOrder, WCOrder, WCAddress, WCOrderLineItem, WCOrderTotals]
  affects: [order-confirmation-page, arc-next-integration]
tech_stack:
  added: []
  patterns:
    - "null-on-404 pattern — getOrder returns null instead of throwing on 404 (order not in session)"
    - "WooClientError.status dispatch — 404 caught and converted to null; all other errors re-thrown"
    - "Store API architectural boundary — listCustomerOrders lives in WPGraphQL, not Store API"
    - "Contract tests gated behind CI_WP_ENV=true — skip cleanly in unit test runs"
key_files:
  created:
    - Arc/Core/src/store-api/orders.ts
    - Arc/Core/src/types/orders.ts
    - Arc/Core/src/__tests__/contract/orders.contract.ts
  modified:
    - Arc/Core/src/index.ts
decisions:
  - "getOrder returns null (not throws) on 404 — both 'not found' and 'wrong session' produce 404 from the Store API; null is safer for order confirmation page usage"
  - "Order types in separate src/types/orders.ts — keeps woo.ts cart-focused, orders.ts order-focused; clear ownership"
  - "WooClientError used directly (not ArcRequestError) — matches the actual error class in WooClient.ts (plan referenced a hypothetical ArcRequestError that doesn't exist)"
metrics:
  duration: "~8m"
  completed_date: "2026-05-29"
  tasks_completed: 2
  files_created: 3
  files_modified: 1
---

# Phase 1 Plan 06: Orders Module Summary

**One-liner:** `getOrder(client, orderId)` against WC Store API `/order/{id}` with null-on-404 session safety, hand-authored order types, and wp-env contract tests — with JSDoc documenting the Store API limitation that listCustomerOrders belongs in WPGraphQL.

---

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Orders module + types + barrel export | `7205ea8` | `Arc/Core/src/store-api/orders.ts`, `Arc/Core/src/types/orders.ts`, `Arc/Core/src/index.ts` |
| 2 | Orders contract tests | `de3c266` | `Arc/Core/src/__tests__/contract/orders.contract.ts` |

---

## What Was Built

### `Arc/Core/src/types/orders.ts`
Hand-authored TypeScript types for the WC Store API `/order/{id}` response surface:
- `WCAddress` — billing/shipping address fields
- `WCOrderLineItem` — id, product_id, variation_id, quantity, name, sku, total, total_tax
- `WCOrderTotals` — total_items, total_tax, total_shipping, total_price, currency_code
- `WCOrder` — id, number, status, currency, date_created, billing, shipping, line_items, totals, payment_method, payment_method_title

### `Arc/Core/src/store-api/orders.ts`
Single-function module:
- `getOrder(client: WooClient, orderId: number): Promise<WCOrder | null>` — GET `/order/{id}` via `WooClient.request<T>()`. Returns `null` on 404 (covers both "order not found" and "order belongs to a different Cart-Token session"). Re-throws all other `WooClientError` instances.
- Module-level JSDoc prominently documents the Store API limitation: `listCustomerOrders` does not exist in the Store API and must use the WPGraphQL customer module.

### `Arc/Core/src/__tests__/contract/orders.contract.ts`
Three wp-env contract tests, all gated with `test.skipIf(!process.env['CI_WP_ENV'])`:
1. Valid session order retrieval — asserts non-null, correct id, line_items array, status string, totals object
2. Non-existent ID returns null — asserts `getOrder(client, 999999)` returns null, not throws
3. Cross-session isolation — creates second `WooClient` instance with independent session, asserts null when accessing first session's order ID (comment: "Verifies Cart-Token session isolation — critical for multi-tenant security")

### Barrel Update (`Arc/Core/src/index.ts`)
Added:
```ts
export { getOrder } from './store-api/orders';
export type { WCAddress, WCOrder, WCOrderLineItem, WCOrderTotals } from './types/orders';
```

### Verification

```
$ npx tsup (from worktree)
ESM  dist/index.mjs     6.71 KB   (+0.27 KB)
CJS  dist/index.js      6.85 KB
DTS  dist/index.d.ts   11.09 KB   (+2.08 KB — new types confirmed)
Build success

$ npx vitest run
 Test Files  3 passed (3)
       Tests  32 passed (32)
   Duration  246ms

$ grep "getOrder" dist/index.d.ts
declare function getOrder(client: WooClient, orderId: number): Promise<WCOrder | null>;
FOUND
```

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Plan referenced non-existent ArcRequestError class**
- **Found during:** Task 1 implementation
- **Issue:** The plan's `<action>` block imports `ArcRequestError` from `'../http/errors.js'` — neither file nor class exists. The actual error class is `WooClientError` from `'../client/WooClient.ts'`.
- **Fix:** Used `WooClientError` (which has `.status` directly) instead of `ArcRequestError`. The null-on-404 logic is identical in behavior.
- **Files modified:** `Arc/Core/src/store-api/orders.ts`
- **Commit:** `7205ea8`

**2. [Rule 2 - Missing] Created src/types/orders.ts as separate file**
- **Found during:** Task 1 — `<actual_state>` said "ADD order types to woo.ts" but the plan's `<interfaces>` and `<action>` both reference `src/types/orders.ts`
- **Decision:** Created `orders.ts` as a separate types file — cleaner separation of concerns (woo.ts = cart surface, orders.ts = order surface), matches the plan's import path `'../types/orders.js'`.

**3. [Rule 3 - Blocking] Build must run from worktree path**
- **Found during:** Task 1 verification
- **Issue:** Running `pnpm --filter @arc/core build` from the main repo path (`/d/00. Arc Platform`) built the main repo's `@arc/core`, not the worktree's. The build appeared to succeed but produced no new exports.
- **Fix:** Ran build directly from worktree: `cd /d/00. Arc Platform/.claude/worktrees/agent-a7cfc7cdeeebda8c3/Arc/Core && npx tsup`

---

## Known Stubs

None. `getOrder` is fully implemented against the WC Store API `/order/{id}` endpoint.

`listCustomerOrders` is intentionally absent from this module — it is documented in JSDoc and will be implemented in Plan 01-07 (Customer + Orders GQL module) using WPGraphQL.

---

## Self-Check: PASSED

Files verified present:
- `Arc/Core/src/store-api/orders.ts` — FOUND
- `Arc/Core/src/types/orders.ts` — FOUND
- `Arc/Core/src/__tests__/contract/orders.contract.ts` — FOUND

Commits verified:
- `7205ea8` — feat(01-06): implement getOrder
- `de3c266` — test(01-06): add contract tests for getOrder — ARC-API-07
