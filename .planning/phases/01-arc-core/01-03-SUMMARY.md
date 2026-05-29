---
phase: 1
plan: 03
subsystem: arc-core
tags: [checkout, store-api, woo-client, typescript-types, contract-tests, payment-gateway]
dependency_graph:
  requires: [01-01-woo-client]
  provides: [checkout-module, WCCheckoutPayload, WCCheckoutResponse, WCPaymentGateway]
  affects: [01-02-products, 01-04-customer, 01-05-search, 01-06-orders]
tech_stack:
  added: []
  patterns:
    - "Checkout functions accept WooClient as first arg — no singleton, no module-level state"
    - "payment_data passed verbatim — no gateway token inspection"
    - "Contract tests gated behind CI_WP_ENV=true (skipIf pattern)"
    - "globalThis cast for process.env in contract tests — avoids @types/node in tsconfig lib"
key_files:
  created:
    - Arc/Core/src/store-api/checkout.ts
    - Arc/Core/src/types/checkout.ts
    - Arc/Core/src/__tests__/checkout.test.ts
    - Arc/Core/src/__tests__/contract/checkout.contract.ts
  modified:
    - Arc/Core/src/index.ts
decisions:
  - "WCPaymentGateway exported from store-api/checkout.ts (not types/checkout.ts) — collocated with the function that uses it"
  - "submitCheckout passes payment_data verbatim — no transformation, no inspection of gateway tokens"
  - "Contract test uses globalThis cast for process.env — avoids adding @types/node to tsconfig lib (DOM-only project)"
  - "submitCheckout contract test explicitly skipped — Phase 5 E2E covers full payment flow with real tokens"
metrics:
  duration: "~6m"
  completed_date: "2026-05-29"
  tasks_completed: 2
  files_created: 4
  files_modified: 1
---

# Phase 1 Plan 03: Checkout Module Summary

**One-liner:** Three WC Store API checkout functions (`getCheckoutSchema`, `submitCheckout`, `getPaymentGateways`) with hand-authored TypeScript types and CI_WP_ENV-gated contract tests — gateway tokens pass through verbatim per security requirement.

---

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 (RED) | Checkout types + failing tests | `b3539a1` | `Arc/Core/src/types/checkout.ts`, `Arc/Core/src/__tests__/checkout.test.ts` |
| 1 (GREEN) | Checkout module implementation | `3b44106` | `Arc/Core/src/store-api/checkout.ts`, `Arc/Core/src/index.ts` |
| 2 | Contract tests | `050a862` | `Arc/Core/src/__tests__/contract/checkout.contract.ts` |

---

## What Was Built

### `Arc/Core/src/types/checkout.ts`
Hand-authored TypeScript types for the WC Store API v1 checkout surface: `WCAddress`, `WCBillingAddress`, `WCPaymentData`, `WCCheckoutPayload`, `WCPaymentResult`, `WCCheckoutResponse`. Types derived from WC Store API source + docs — no runtime code.

### `Arc/Core/src/store-api/checkout.ts`
Three functions — all accept `WooClient` as first argument, delegate entirely to `client.request()`:
- `getCheckoutSchema(client)` — `GET /checkout`, returns cart-shaped `WooCart` for checkout display
- `submitCheckout(client, payload)` — `POST /checkout`, never transforms `payment_data`
- `getPaymentGateways(client)` — `GET /payment-gateways`, returns `WCPaymentGateway[]`

Also exports `WCPaymentGateway` interface (collocated with its function).

### `Arc/Core/src/__tests__/checkout.test.ts`
4 Vitest unit tests (all passing):
- `getCheckoutSchema` calls `GET /checkout`
- `getPaymentGateways` calls `GET /payment-gateways`
- `submitCheckout` calls `POST /checkout` with correct body
- `submitCheckout` does not transform `payment_data` (verbatim pass-through assertion)

### `Arc/Core/src/__tests__/contract/checkout.contract.ts`
Contract tests gated behind `CI_WP_ENV=true`:
- `getCheckoutSchema` — asserts `items` (array) and `totals` (object)
- `getPaymentGateways` — asserts array with `id` (string) and `enabled` (boolean) per element
- `submitCheckout` — explicit `test.skip` with documented reason (Phase 5 E2E)

### Verification

```
$ npx vitest run
 Test Files  4 passed (4)
       Tests  36 passed (36)
   Duration  396ms

$ npx tsup
ESM  dist/index.mjs    6.84 KB
CJS  dist/index.js     7.05 KB
DTS  dist/index.d.ts   11.77 KB
Build success

$ npx tsc --noEmit
(exit 0 — zero type errors)

$ grep "from.*next/" Arc/Core/src/store-api/checkout.ts
(exit 1 — no next imports — PASS)
```

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Incorrect WooClient.request() signature in plan context**
- **Found during:** Task 1 implementation
- **Issue:** The plan's `<interfaces>` block showed `request<T>(method: string, path: string, options?)` (2-arg), but the actual `WooClient.request<T>(path, init?)` is 1-arg with `init.method` for HTTP verb — matching the `RequestInit` pattern.
- **Fix:** Implemented using the actual signature: `client.request<WCCart>('/checkout')` for GET and `client.request<WCCheckoutResponse>('/checkout', { method: 'POST', body: JSON.stringify(payload) })` for POST.
- **Files modified:** `Arc/Core/src/store-api/checkout.ts`

**2. [Rule 2 - Missing functionality] `process.env` type error in contract test**
- **Found during:** Task 2 — `tsc --noEmit` reported 3 errors on `process.env` usage
- **Issue:** Project tsconfig uses `lib: ["ES2022", "DOM", "DOM.Iterable"]` — no `@types/node`, so `process` is untyped.
- **Fix:** Used `(globalThis as any).process?.env ?? {}` cast — avoids adding `@types/node` to the project's tsconfig while preserving runtime behaviour (Vitest provides `process` at runtime via Node).
- **Files modified:** `Arc/Core/src/__tests__/contract/checkout.contract.ts`
- **Commit:** `050a862`

---

## Known Stubs

None. All three functions are fully implemented. `submitCheckout` contract test is intentionally skipped (not a stub) — it requires a seeded cart with real payment tokens, which is Phase 5 E2E scope.

---

## Self-Check: PASSED

Files verified present:
- `Arc/Core/src/store-api/checkout.ts` — FOUND
- `Arc/Core/src/types/checkout.ts` — FOUND
- `Arc/Core/src/__tests__/checkout.test.ts` — FOUND
- `Arc/Core/src/__tests__/contract/checkout.contract.ts` — FOUND

Commits verified:
- `b3539a1` — test(01-03): add failing tests for checkout module (RED)
- `3b44106` — feat(01-03): implement checkout module — getCheckoutSchema, submitCheckout, getPaymentGateways
- `050a862` — test(01-03): add checkout contract tests for ARC-API-05
