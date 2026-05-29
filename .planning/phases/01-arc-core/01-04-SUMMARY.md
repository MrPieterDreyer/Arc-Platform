---
phase: 1
plan: 04
subsystem: arc-core
tags: [graphql, wpgraphql, products, two-fragment-pattern, graphql-request, contract-tests]
dependency_graph:
  requires: [01-01]
  provides: [createWPGraphQLClient, getProduct, getProducts, getProductVariations, WCProduct-types]
  affects: [01-05-collections-search, 01-08-hooks]
tech_stack:
  added:
    - "graphql-request@^7.4.0 (runtime dep — WPGraphQL HTTP client)"
    - "graphql@catalog: (peer, already in catalog)"
  patterns:
    - "Two-fragment pattern: *ListFields (listing pages) vs *DetailFields (PDP) — ARC-GQL-04 standard"
    - "Inline document fallback: gql`` tag until pnpm codegen runs against live wp-env"
    - "Contract tests gated behind CI_WP_ENV=true env flag"
    - "globalThis.process check for framework-agnostic dev-mode detection"
key_files:
  created:
    - Arc/Core/src/graphql/client.ts
    - Arc/Core/src/graphql/products.graphql
    - Arc/Core/src/graphql/products.ts
    - Arc/Core/src/types/products.ts
    - Arc/Core/src/__tests__/contract/products.contract.ts
    - Arc/Core/src/graphql/__generated__/.gitkeep
  modified:
    - Arc/Core/src/index.ts
    - Arc/Core/package.json
    - Arc/Core/vitest.config.ts
    - pnpm-workspace.yaml
decisions:
  - "Inline gql`` documents used instead of __generated__ imports — codegen requires a live wp-env which is not available in Phase 1; structure allows drop-in swap once codegen runs"
  - "globalThis.process pattern used for dev-mode check instead of process.env directly — keeps DTS clean without @types/node dependency"
  - "vitest include extended to *.contract.ts — plan mandates the .contract.ts naming convention; include pattern updated to match"
  - "ARC-GQL-01 marked complete alongside ARC-GQL-03/04 — createWPGraphQLClient was the missing pre-requisite and was built here"
  - "onlyBuiltDependencies: [esbuild] added to pnpm-workspace.yaml to resolve ERR_PNPM_IGNORED_BUILDS on graphql-request install"
metrics:
  duration: "~25m"
  completed_date: "2026-05-29"
  tasks_completed: 2
  files_created: 6
  files_modified: 4
---

# Phase 1 Plan 04: Products GraphQL Module Summary

**One-liner:** WPGraphQL client factory + three-fragment products schema (`ProductListFields` / `ProductDetailFields` / `VariableProductDetailFields`) + typed `getProduct`, `getProducts`, `getProductVariations` wrappers + CI_WP_ENV-gated contract tests — establishes the two-fragment architectural standard for all catalog modules.

---

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | GraphQL client factory + Products module | `57e598c` | `src/graphql/client.ts`, `src/graphql/products.graphql`, `src/graphql/products.ts`, `src/types/products.ts`, `src/index.ts` |
| 2 | Products contract tests | `835a3d2` | `src/__tests__/contract/products.contract.ts`, `vitest.config.ts` |

---

## What Was Built

### `Arc/Core/src/graphql/client.ts`
`createWPGraphQLClient(config: WPGraphQLConfig): GraphQLClient` — factory function that:
- Wires `requestMiddleware` to inject `Authorization: Bearer <token>` when `authToken()` returns a value
- Wires `responseMiddleware` to log GraphQL-level errors in dev environments (via `globalThis.process` check — no `@types/node` needed)
- No `next/*` imports — fully framework-agnostic

### `Arc/Core/src/graphql/products.graphql`
Three fragments and two queries:
- `ProductListFields on SimpleProduct` — 9 fields, optimised for listing pages (no variations, no gallery)
- `ProductDetailFields on SimpleProduct` — spreads `ProductListFields` + description, shortDescription, galleryImages, attributes, related (full PDP payload)
- `VariableProductDetailFields on VariableProduct` — databaseId, slug, name, price + full variations matrix
- `GetProduct($slug: ID!)` — uses both SimpleProduct and VariableProduct inline fragments
- `GetProducts($first, $after, $where)` — paginated list with ListFields only

### `Arc/Core/src/graphql/products.ts`
Typed wrapper functions:
- `getProduct(client, slug): Promise<WCProduct | null>` — single product by slug
- `getProducts(client, filter?): Promise<WCProductList>` — paginated list with `WCProductFilter` mapping to `where` args
- `getProductVariations(product): WCProductVariation[]` — pure function, returns `variations.nodes ?? []`
- Inline `gql` documents as fallback until `pnpm codegen` runs against a live wp-env instance

### `Arc/Core/src/types/products.ts`
Hand-authored WPGraphQL product types: `WCProduct`, `WCProductVariation`, `WCProductImage`, `WCProductCategory`, `WCProductAttribute` — no runtime code.

### `Arc/Core/src/__tests__/contract/products.contract.ts`
5 CI_WP_ENV-gated tests covering:
1. `getProduct by slug` — field shape validation (ARC-GQL-03)
2. `getProducts list` — pageInfo + nodes array (ARC-GQL-03)
3. `getProducts with search filter` — WCProductList shape
4. Two-fragment pattern — DetailFields has `galleryImages`, ListFields nodes do not (ARC-GQL-04)
5. `getProductVariations` — variation matrix with databaseId + attributes (ARC-GQL-03)

Plus placeholder `describe` blocks for ARC-GQL-05 (Collections) and ARC-GQL-06 (Search) — filled by Plan 01-05.

### Verification

```
$ npx tsup (run directly — pnpm wrapper blocked by esbuild build-scripts flag)
ESM  dist/index.mjs     9.88 KB  ✓
CJS  dist/index.js     10.17 KB  ✓
DTS  dist/index.d.ts   12.24 KB  ✓
Build success

$ npx vitest run (all 4 test files)
Test Files  3 passed | 1 skipped (4)
      Tests  32 passed | 7 skipped (39)
```

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] `graphql-request` install blocked by esbuild build-scripts flag**

- **Found during:** Task 1 dependency install
- **Issue:** `pnpm --filter @arc/core add graphql-request` failed with `ERR_PNPM_IGNORED_BUILDS: esbuild@0.27.7`. The `pnpm-workspace.yaml` had a placeholder `allowBuilds` block (autopopulated by pnpm from a prior install) that wasn't resolving the build permission correctly.
- **Fix:** Changed `allowBuilds` (placeholder format) to `onlyBuiltDependencies: [esbuild]` in `pnpm-workspace.yaml`. Ran `pnpm install --frozen-lockfile=false` to symlink the already-downloaded package into the workspace node_modules. `graphql-request@7.4.0_graphql@16.14.0` was confirmed present in the pnpm virtual store.
- **Files modified:** `pnpm-workspace.yaml`
- **Commit:** included in `57e598c`

**2. [Rule 1 — Bug] `process.env.NODE_ENV` DTS build error**

- **Found during:** Task 1 build verification
- **Issue:** `src/graphql/client.ts` used `process.env.NODE_ENV` directly. tsup's DTS emit failed: `error TS2580: Cannot find name 'process'` — `@types/node` is not a dependency of `@arc/core` (and should not be, since it's a framework-agnostic package that ships to browsers).
- **Fix:** Replaced `process.env.NODE_ENV` with `globalThis.process?.env?.NODE_ENV` guarded by an `'process' in globalThis` check + a `biome-ignore` comment. DTS build passes without `@types/node`.
- **Files modified:** `Arc/Core/src/graphql/client.ts`
- **Commit:** included in `57e598c`

**3. [Rule 3 — Blocking] Vitest `include` pattern didn't match `.contract.ts` files**

- **Found during:** Task 2 test run
- **Issue:** `vitest.config.ts` only included `src/**/*.test.ts`. Running the contract file reported "No test files found".
- **Fix:** Extended `include` to `['src/**/*.test.ts', 'src/**/*.contract.ts']` — matches the plan's mandated naming convention.
- **Files modified:** `Arc/Core/vitest.config.ts`
- **Commit:** `835a3d2`

**4. [Rule 2 — Missing] `ARC-GQL-01` delivered alongside `ARC-GQL-03/04`**

- **Found during:** Task 1 (pre-requisite check in `actual_state`)
- **Issue:** `src/graphql/client.ts` (`createWPGraphQLClient`) was listed in the plan's `actual_state` as missing and was built here. This satisfies ARC-GQL-01 which was never formally assigned to a prior plan.
- **Fix:** Built `createWPGraphQLClient` as part of Task 1. Marked ARC-GQL-01 complete in REQUIREMENTS.md.
- **Files modified:** `Arc/Core/src/graphql/client.ts`, `.planning/REQUIREMENTS.md`

---

## Known Stubs

**Inline GraphQL documents in `products.ts`:** The `GetProductDocument` and `GetProductsDocument` are defined inline using the `gql` tag instead of importing from `src/graphql/__generated__/`. This is intentional — codegen (`pnpm codegen`) requires a running WPGraphQL endpoint (wp-env), which is not available in Phase 1. The file structure is designed for a drop-in swap: replace `import { gql } from 'graphql-request'` and the inline documents with `import { GetProductDocument, GetProductsDocument } from './__generated__/graphql'` once codegen runs in Phase 5/CI.

The `__generated__/.gitkeep` placeholder is committed. The directory is NOT gitignored yet — it will be added to `.gitignore` when codegen is wired in Phase 5.

---

## Self-Check: PASSED

Files verified present:
- `Arc/Core/src/graphql/client.ts` — FOUND
- `Arc/Core/src/graphql/products.graphql` — FOUND
- `Arc/Core/src/graphql/products.ts` — FOUND
- `Arc/Core/src/types/products.ts` — FOUND
- `Arc/Core/src/__tests__/contract/products.contract.ts` — FOUND

Commits verified:
- `57e598c` — feat(01-04): add WPGraphQL client factory + Products GraphQL module
- `835a3d2` — test(01-04): add products contract tests + extend vitest include pattern

Build: ESM + CJS + DTS all pass. 32 existing tests pass, 7 new contract tests skip cleanly.
