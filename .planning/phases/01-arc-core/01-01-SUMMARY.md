---
phase: 1
plan: 01
subsystem: arc-core
tags: [woo-client, cart-token, nonce, http, store-api, typescript-types, vitest]
dependency_graph:
  requires: [00-tooling-foundations]
  provides: [WooClient, isWooError, withRetry, woo-types]
  affects: [01-02-products, 01-03-checkout, 01-04-customer, 01-05-search, 01-06-orders, 01-07-collections, 01-08-hooks]
tech_stack:
  added: ["zod@catalog: (declared, not yet used — reserved for Phase 1 follow-on plans)"]
  patterns:
    - "onCartToken callback — framework-agnostic Cart-Token lifecycle (ADR-0006)"
    - "WooClientError typed error class with .status for withRetry dispatch"
    - "withRetry exponential backoff — 1s/2s/4s delays, 5xx-only, max 3 attempts"
    - "AbortSignal.any() for combined timeout + external cancellation"
key_files:
  created:
    - Arc/Core/src/types/woo.ts
    - Arc/Core/src/http.ts
    - Arc/Core/src/client/WooClient.ts
    - Arc/Core/src/__tests__/http.test.ts
    - Arc/Core/src/__tests__/woo-client.test.ts
  modified:
    - Arc/Core/src/index.ts
    - Arc/Core/package.json
    - pnpm-lock.yaml
decisions:
  - "WooClient is framework-agnostic: fires onCartToken callback, never touches cookies directly (ADR-0006 compliance)"
  - "WooClientError extends Error with .code + .status — .status enables withRetry to distinguish 4xx (no retry) from 5xx (retry)"
  - "withRetry lives in http.ts (not WooClient) — separates concerns, reusable by future Store API agents"
  - "AbortSignal.any() used for combined timeout + external cancel — falls back to timeout-only if AbortSignal.any unavailable"
metrics:
  duration: "~6m"
  completed_date: "2026-05-29"
  tasks_completed: 5
  files_created: 5
  files_modified: 3
---

# Phase 1 Plan 01: WooClient — HTTP Foundation + Cart-Token Session Summary

**One-liner:** Framework-agnostic `WooClient` with transparent Cart-Token session management, `rest_cookie_invalid_nonce` auto-refresh, exponential backoff on 5xx, and hand-authored WC Store API v1 TypeScript types — the mandatory pre-step for all Phase 1 Store API agents.

---

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | WooClient types | `0ff0876` | `Arc/Core/src/types/woo.ts` |
| 2 | HTTP utility | `0ff0876` | `Arc/Core/src/http.ts` |
| 3 | WooClient class | `0ff0876` | `Arc/Core/src/client/WooClient.ts` |
| 4 | Barrel exports + package.json deps | `0ff0876` | `Arc/Core/src/index.ts`, `Arc/Core/package.json` |
| 5 | Vitest unit tests | `0fa9169` | `Arc/Core/src/__tests__/http.test.ts`, `Arc/Core/src/__tests__/woo-client.test.ts` |

---

## What Was Built

### `Arc/Core/src/types/woo.ts`
Hand-authored TypeScript types for the WC Store API v1 cart surface: `WooClientOptions`, `WooRequestOptions`, `WooCart`, `WooCartItem`, `WooCartItemPrices`, `WooCartItemImage`, `WooCartTotals`, `WooCartCoupon`, `WooMoney`, `WooApiError`. Types are derived from WC source + docs — no runtime code, no generated types.

### `Arc/Core/src/http.ts`
Three pure utilities:
- `isWooError(body)` — type-guard that verifies the WC error shape `{ code, message, data.status }`
- `sleep(ms)` — Promise-based delay for backoff
- `withRetry(fn, opts)` — exponential backoff retry (1s/2s/4s) that only retries when thrown error has `.status >= 500`; re-throws immediately on 4xx or network errors

### `Arc/Core/src/client/WooClient.ts`
The `WooClient` class — framework-agnostic WC Store API v1 client:
- Constructor accepts `WooClientOptions`: `baseUrl`, `onCartToken?`, `getCartToken?`, `getNonce?`, `onNonce?`, `timeout?`
- `request<T>(path, init?)` — core method: injects `Cart-Token` header, extracts token from response, fires `onCartToken` on change, handles nonce retry, delegates 5xx to `withRetry`
- Cart methods: `getCart()`, `addToCart(id, qty)`, `updateCartItem(key, qty)`, `removeCartItem(key)`, `applyCoupon(code)`, `removeCoupon(code)`
- `WooClientError` — typed error carrying `.code`, `.status`, `.data` from the API response

### Verification

```
$ npx vitest run
 Test Files  3 passed (3)
       Tests  32 passed (32)
   Duration  244ms

$ npx tsup
ESM  dist/index.mjs     6.44 KB
CJS  dist/index.js      6.57 KB
DTS  dist/index.d.ts    9.01 KB
Build success in 356ms

$ bash Scripts/check-no-next-in-core.sh
(exit 0 — no next/* imports)
```

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Response body already-read error on retry**
- **Found during:** Task 5 test run
- **Issue:** Test mocks used `mockResolvedValue(singleResponse)` — the same `Response` instance was reused across `withRetry` attempts, causing "Body is unusable: Body has already been read" on the second attempt.
- **Fix:** Changed mocks to `mockImplementation(async () => makeJsonResponse(...))` so each retry receives a fresh Response object. This exposed correct real-world behaviour: each fetch call always returns a new response.
- **Files modified:** `Arc/Core/src/__tests__/woo-client.test.ts`

**2. [Rule 1 - Bug] Unhandled rejection race with fake timers**
- **Found during:** Task 5 test run
- **Issue:** Tests that used `const promise = withRetry(...); await vi.advanceTimersByTimeAsync(...); await expect(promise).rejects...` caused unhandled rejection warnings because the rejection occurred before the `.rejects` handler was attached.
- **Fix:** Reordered to `const assertion = expect(withRetry(...)).rejects...; await vi.advanceTimersByTimeAsync(...); await assertion` — attaches the rejection handler before advancing timers.
- **Files modified:** `Arc/Core/src/__tests__/http.test.ts`, `Arc/Core/src/__tests__/woo-client.test.ts`

---

## Known Stubs

None. All exported APIs are fully implemented. The `__ARC_CORE_VERSION` sentinel from Phase 0 is retained intentionally.

`zod` is declared as a direct dep in `Arc/Core/package.json` but not yet imported — it is reserved for Zod-validated response parsing in follow-on Phase 1 plans (products, checkout, customer, etc.).

---

## Self-Check: PASSED

Files verified present:
- `Arc/Core/src/types/woo.ts` — FOUND
- `Arc/Core/src/http.ts` — FOUND
- `Arc/Core/src/client/WooClient.ts` — FOUND
- `Arc/Core/src/__tests__/http.test.ts` — FOUND
- `Arc/Core/src/__tests__/woo-client.test.ts` — FOUND

Commits verified:
- `0ff0876` — feat(01-01): implement WooClient — Cart-Token + Nonce HTTP foundation
- `0fa9169` — test(01-01): add Vitest unit tests for WooClient + HTTP utilities
- `49fdb83` — docs(01-01): add Phase 1 plan 01 — WooClient HTTP foundation
