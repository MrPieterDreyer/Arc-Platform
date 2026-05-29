# Phase 01 — Checker Fix Summary

**Applied:** 2026-05-28
**Fixes:** 4 blockers + 3 warnings resolved

---

## BLOCKER 1 — listCustomerOrders name mismatch

**Files changed:** `.planning/REQUIREMENTS.md`, `.planning/phases/01-arc-core/01-VALIDATION.md`

**What changed:**
- REQUIREMENTS.md ARC-API-07 description updated from `getOrder, listCustomerOrders with pagination` to `getOrder, getCustomerOrders (via WPGraphQL — Store API has no authenticated list-orders endpoint)`.
- VALIDATION.md ARC-API-07 row expanded to clarify: `getOrder` lives in Plan 01-06 (Store API), `getCustomerOrders` lives in Plan 01-07 (WPGraphQL/graphql/customer.ts). The Store API has no list-orders endpoint — `listCustomerOrders` was never a valid function name for this surface.

---

## BLOCKER 2 — Wave 1 race condition on products.contract.ts

**Files changed:** `.planning/phases/01-arc-core/01-05-PLAN.md`, `.planning/phases/01-arc-core/01-VALIDATION.md`

**What changed:**
- Plan 01-05 `depends_on` updated from `["01-01"]` to `["01-01", "01-04"]`. Plan 01-05 fills in contract test placeholders that Plan 01-04 scaffolds — the dependency must be explicit.
- `products.contract.ts` removed from Plan 01-05 `files_modified`. Plan 01-04 owns that file exclusively.
- Plan 01-05 now creates its own contract file: `Arc/Core/src/__tests__/contract/collections-search.contract.ts`. Task 2 updated accordingly — creates the file fresh rather than appending to products.contract.ts.
- Plan 01-05 objective updated to reflect the new file name.
- VALIDATION.md ARC-GQL-05 and ARC-GQL-06 test commands updated to reference `collections-search.contract.ts`.
- VALIDATION.md File Ownership table updated: `products.contract.ts` is Plan 01-04 only; `collections-search.contract.ts` is Plan 01-05 only.

---

## BLOCKER 3 — graphql.perf.ts never filled in

**Files changed:** `.planning/phases/01-arc-core/01-08-PLAN.md`, `.planning/phases/01-arc-core/01-VALIDATION.md`

**What changed:**
- Plan 01-08 gained a new **Task 3**: "Fill in graphql.perf.ts with timed performance assertions". This task writes one `test.skipIf(!process.env.CI_WP_ENV)(...)` per documented GQL query: `getProduct`, `listProducts` (getProducts), `getCollection`, `listCollections`, `getCollectionProducts`, `searchProducts`, `getCustomer` (via getCustomerOrders) — each using `performance.now()` before/after the query call and asserting `elapsed < 500`.
- `Arc/Core/src/__tests__/perf/graphql.perf.ts` added to Plan 01-08 `files_modified`.
- VALIDATION.md ARC-GQL-07 row updated to reference Plan 01-08 Task 3 explicitly and enumerate all 7 tested queries.
- Phase gate check #10 added: `grep -c "test.skipIf" Arc/Core/src/__tests__/perf/graphql.perf.ts`.

---

## BLOCKER 4 — @testing-library install ordered after first use

**Files changed:** `.planning/phases/01-arc-core/01-09-PLAN.md`

**What changed:**
- Plan 01-09 Task 1 action reordered: `pnpm --filter @arc/core add -D @testing-library/react @testing-library/jest-dom` install command moved to the **beginning** of Task 1's action block, before any file writes.
- The install command removed from Task 2 (it was duplicated there; install once in Task 1 is sufficient).

---

## WARNING 1 — Inline gql documents never replaced

**Files changed:** `.planning/phases/01-arc-core/01-08-PLAN.md`

**What changed:**
- Plan 01-08 gained a new **Task 4**: "Replace inline gql documents with __generated__ imports". This task reads each of `src/graphql/products.ts`, `src/graphql/collections.ts`, `src/graphql/search.ts`, `src/graphql/customer.ts` and replaces the inline `gql\`...\`` template literals with typed `__generated__` imports (e.g. `import { ProductsDocument } from './__generated__/graphql.js'`).
- Task is gated on `CI_WP_ENV` — the `__generated__` directory requires a live WPGraphQL endpoint. If codegen has not run, TODO comments are added to each file instead.
- All 4 graphql source files added to Plan 01-08 `files_modified`.

---

## WARNING 2 — @testing-library/jest-dom not configured for Vitest

**Files changed:** `.planning/phases/01-arc-core/01-09-PLAN.md`

**What changed:**
- Plan 01-09 Task 1 action updated to include: update `Arc/Core/vitest.config.ts` to add `setupFiles: ['@testing-library/jest-dom/vitest']`. This wires jest-dom matchers into the Vitest test environment so `toBeInTheDocument`, `toHaveTextContent`, etc. work without per-file imports.
- `Arc/Core/vitest.config.ts` added to Plan 01-09 `files_modified`.
- `Arc/Core/vitest.config.ts` added to Plan 01-09 `must_haves.artifacts`.
- Plan 01-09 success criteria updated to explicitly require the setupFiles config.
- Verification block updated with a grep check: `grep "jest-dom" Arc/Core/vitest.config.ts`.

---

## WARNING 3 — Missing positive Cart-Token sharing test

**Files changed:** `.planning/phases/01-arc-core/01-08-PLAN.md`, `.planning/phases/01-arc-core/01-VALIDATION.md`

**What changed:**
- Plan 01-08 Task 2 expanded to add a Cart-Token sharing test to `Arc/Core/src/__tests__/contract/cart.contract.ts`. The test creates two `WooClient` instances both seeded with the same `SessionStore` (simulating two browser tabs sharing the same `arc_cart_token` cookie), calls `getCart` on both, and asserts identical `items_count` and `total_price`.
- `Arc/Core/src/__tests__/contract/cart.contract.ts` added to Plan 01-08 `files_modified`.
- Plan 01-08 `must_haves.truths` updated to include the Cart-Token sharing test assertion.
- VALIDATION.md ARC-API-01 row updated to mention the multi-tab sharing test in cart.contract.ts.
- VALIDATION.md Phase Success Criterion #1 (multi-tab Vitest E2E) updated to reference Plan 01-08 Task 2 as the implementation location.
- VALIDATION.md Phase gate check #11 added to verify the test exists.
