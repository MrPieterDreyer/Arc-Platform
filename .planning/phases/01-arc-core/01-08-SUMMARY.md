---
phase: 1
plan: 08
subsystem: arc-core
tags: [types, codegen, perf-tests, store-api-types]
dependency_graph:
  requires: [01-01, 01-02, 01-03, 01-04, 01-05, 01-06, 01-07]
  provides: [complete-type-stubs, codegen-config, perf-scaffold, hooks-scaffold]
  affects: [01-09]
key_files:
  created:
    - Arc/Core/src/types/cart.ts
    - Arc/Core/src/types/errors.ts
    - Arc/Core/codegen.ts
    - Arc/Core/src/__tests__/perf/graphql.perf.ts
    - .env.example
    - Arc/Core/.gitignore
  modified:
    - Arc/Core/src/types/orders.ts
    - Arc/Core/src/types/products.ts
    - Arc/Core/src/__tests__/contract/cart.contract.ts
    - Arc/Core/package.json
    - pnpm-workspace.yaml
decisions:
  - "types/cart.ts created as standalone file — 13 complete WC* interfaces covering full cart response shape"
  - "WCStoreProduct added to types/products.ts for Store API REST shape (distinct from WPGraphQL WCProduct)"
  - "codegen.ts wired to WP_GRAPHQL_ENDPOINT env var with localhost:8888 fallback — generated output gitignored"
  - "Perf tests use test.skipIf(!CI_WP_ENV) gate — safe in unit CI, run in integration env"
metrics:
  duration: "~9m"
  completed_date: "2026-05-29"
  tasks_completed: 4
  files_created: 6
  files_modified: 5
---

# Phase 1 Plan 08: Types Reconciliation + Codegen Config + Perf Scaffold

**One-liner:** Complete Store API type stubs, wire graphql-codegen config, scaffold perf budget tests, and prepare hooks.test.ts for Wave 3.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Store API type stubs completed | `ab60255` | `Arc/Core/src/types/cart.ts`, `errors.ts`, `orders.ts`, `products.ts` |
| 2 | Codegen config + Cart-Token sharing test + env.example | `51a8a8f` | `Arc/Core/codegen.ts`, `.env.example`, `Arc/Core/.gitignore` |
| 3 | GQL perf budget tests | `f458918` | `Arc/Core/src/__tests__/perf/graphql.perf.ts` |
| 4 | TODO(codegen) comments in domain modules | `3237a3d` | `collections.ts`, `search.ts`, `customer.ts` |

## What Was Built

**Type stubs (Task 1):**
- `types/cart.ts` — 13 complete WC* interfaces: WCCart, WCCartItem, WCCartItemPrices, WCCartItemTotals, WCCartTotals, WCCartCoupon, WCCartCouponTotals, WCCartFee, WCShippingRate, WCShippingPackage, WCTaxLine, WCCartError, WCCartItemImage
- `types/errors.ts` — re-exports WooApiError for public access
- `types/orders.ts` — 9 missing fields added (taxes, subtotal, meta_data, coupon_lines, etc.)
- `types/products.ts` — WCStoreProduct + WCProductTag + 4 Store API product types added

**Codegen (Task 2):**
- `Arc/Core/codegen.ts` — complete @graphql-codegen/cli v6 config: client preset, fragmentMasking: false, strictScalars: true, useTypeImports: true
- `pnpm-workspace.yaml` — @graphql-codegen/cli + client-preset added to workspace catalog
- `.env.example` — all contract test + codegen env vars documented (WP_URL, WP_GRAPHQL_ENDPOINT, CI_WP_ENV, TEST_PRODUCT_ID, TEST_COUPON_CODE)
- `Arc/Core/.gitignore` — src/graphql/__generated__/ excluded

**Perf scaffold (Task 3):**
- 7 `test.skipIf(!CI_WP_ENV)` tests — one per documented GQL query
- Each asserts `elapsed < 500ms` via `performance.now()`

## Verification

```
Tests: 36 passed | 30 skipped
Build: ESM + DTS success
no next/* imports: PASS
```

## Self-Check: PASSED

Files verified present:
- `Arc/Core/src/types/cart.ts` — FOUND
- `Arc/Core/codegen.ts` — FOUND
- `Arc/Core/src/__tests__/perf/graphql.perf.ts` — FOUND
- `.env.example` — FOUND
