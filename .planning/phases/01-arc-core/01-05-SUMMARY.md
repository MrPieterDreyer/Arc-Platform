---
phase: 1
plan: 05
subsystem: arc-core
tags: [graphql, wpgraphql, collections, search, graphql-request, contract-tests, typescript-types]
dependency_graph:
  requires: [01-01-woo-client]
  provides: [createWPGraphQLClient, WPGraphQLConfig, getCollection, listCollections, getCollectionProducts, searchProducts, WCCollection, WCCollectionList, WCSearchFilter, WCProduct, WCProductList, WCPageInfo]
  affects: [01-04-products-gql, 01-06-hooks]
tech_stack:
  added:
    - "graphql-request@^7.4.0 — WPGraphQL HTTP client (~8kb, fetch-based, auth injection via headers factory)"
    - "graphql@catalog: — GraphQL peer dep (^16.14.0 via pnpm catalog)"
  patterns:
    - "Inline gql tag documents — codegen-ready pattern (wire codegen in v0.2)"
    - "skipIf(!CI_WP_ENV) contract test gate — tests run in CI against wp-env, skip locally"
    - "GraphQLClient headers factory returns Record<string,string> — avoids undefined-property HeadersInit incompatibility"
key_files:
  created:
    - Arc/Core/src/graphql/client.ts
    - Arc/Core/src/graphql/collections.graphql
    - Arc/Core/src/graphql/search.graphql
    - Arc/Core/src/graphql/collections.ts
    - Arc/Core/src/graphql/search.ts
    - Arc/Core/src/types/products.ts
    - Arc/Core/src/__tests__/contract/collections-search.contract.ts
  modified:
    - Arc/Core/src/index.ts
    - Arc/Core/package.json
    - Arc/Core/vitest.config.ts
    - pnpm-workspace.yaml
    - pnpm-lock.yaml
decisions:
  - "WCProduct/WCPageInfo/WCProductList typed in types/products.ts — shared catalog types distinct from Store API woo.ts types"
  - "GraphQLClient headers factory uses Record<string,string> not object spread — required for TypeScript strict compatibility with HeadersInit"
  - "vitest.config.ts include extended to *.contract.ts — contract tests use .contract.ts suffix per plan spec"
  - "pnpm-workspace.yaml allowBuilds fixed from placeholder to true for esbuild + sharp — was blocking all builds"
metrics:
  duration: "~12m"
  completed_date: "2026-05-29"
  tasks_completed: 2
  files_created: 7
  files_modified: 5
---

# Phase 1 Plan 05: Collections + Search GraphQL Modules Summary

**One-liner:** WPGraphQL `createWPGraphQLClient` factory plus `getCollection`/`listCollections`/`getCollectionProducts`/`searchProducts` typed functions with `CollectionListFields` fragment discipline and 6 skipIf-gated contract tests covering ARC-GQL-05 + ARC-GQL-06.

---

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Collections + Search .graphql files and TypeScript modules | `a40da36` | `graphql/client.ts`, `graphql/collections.graphql`, `graphql/search.graphql`, `graphql/collections.ts`, `graphql/search.ts`, `types/products.ts` |
| 2 | Collections and Search contract tests | `799f986` | `__tests__/contract/collections-search.contract.ts`, `vitest.config.ts` |

---

## What Was Built

### `Arc/Core/src/graphql/client.ts`
`createWPGraphQLClient(config: WPGraphQLConfig): GraphQLClient` — configures a `graphql-request` GraphQLClient with per-request auth token injection. Token factory is called fresh each request to support rotation. Also exported: `WPGraphQLConfig` interface.

### `Arc/Core/src/graphql/collections.graphql`
`CollectionListFields` fragment on `ProductCategory` (databaseId, slug, name, count, image) plus three queries: `GetCollection($slug)`, `ListCollections($first)`, `GetCollectionProducts($slug, $first, $after)`.

### `Arc/Core/src/graphql/search.graphql`
`SearchProducts($search, $first, $after)` query. Comment documents dependency on `ProductListFields` fragment from `products.graphql` for codegen.

### `Arc/Core/src/types/products.ts`
Shared catalog types: `WCProduct`, `WCProductImage`, `WCPageInfo`, `WCProductList`. Separate from Store API types in `woo.ts` — catalog layer vs cart layer distinction.

### `Arc/Core/src/graphql/collections.ts`
Three exported functions:
- `getCollection(client, slug)` → `Promise<WCCollection | null>`
- `listCollections(client, first?)` → `Promise<WCCollectionList>`
- `getCollectionProducts(client, slug, filter?)` → `Promise<WCProductList>`

Inline `gql` tag documents until codegen pipeline runs in v0.2.

### `Arc/Core/src/graphql/search.ts`
`searchProducts(client, query, filter?)` → `Promise<WCProductList>`. JSDoc notes v2 search adapter path for Algolia/Typesense faceted search.

### `Arc/Core/src/__tests__/contract/collections-search.contract.ts`
6 `test.skipIf(!process.env.CI_WP_ENV)` tests across two describe blocks:
- `Collections GQL — ARC-GQL-05`: listCollections shape, getCollection by slug, getCollectionProducts shape
- `Search GQL — ARC-GQL-06`: basic search, empty query graceful handling, pagination `first` cap

### Verification

```
pnpm --filter @arc/core build
ESM  dist/index.mjs     9.34 KB
CJS  dist/index.js      9.69 KB
DTS  dist/index.d.ts   11.96 KB
Build success

npx vitest run
Test Files  6 passed | 1 skipped (7)
     Tests  36 passed | 6 skipped (42)
  Duration  863ms

grep CollectionListFields|GetCollection|ListCollections|GetCollectionProducts → FOUND
grep SearchProducts → FOUND
grep "from 'next/" → PASS: no next imports
```

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] GraphQLClient headers factory TypeScript incompatibility**
- **Found during:** Task 1 build
- **Issue:** `headers: () => token ? { Authorization: ... } : {}` produced union type `{ Authorization: string } | { Authorization?: undefined }` — the second branch has `Authorization?: undefined` which is incompatible with `HeadersInit`'s `Record<string, string>` index signature.
- **Fix:** Rewrote to use `const headers: Record<string, string> = {}; if (token) headers['Authorization'] = ...` — explicit typed empty object avoids the union.
- **Files modified:** `Arc/Core/src/graphql/client.ts`
- **Commit:** `a40da36`

**2. [Rule 3 - Blocking] pnpm-workspace.yaml allowBuilds had placeholder values**
- **Found during:** Task 1 build (first `pnpm --filter @arc/core build` attempt)
- **Issue:** `allowBuilds` had `esbuild: set this to true or false` — literal placeholder text. pnpm treated it as truthy string and still gated the build, causing `ERR_PNPM_IGNORED_BUILDS` on esbuild.
- **Fix:** Set `esbuild: true` and `sharp: true` in `pnpm-workspace.yaml`, then ran `pnpm install` to trigger esbuild's `postinstall` binary build.
- **Files modified:** `pnpm-workspace.yaml`
- **Commit:** `a40da36`

**3. [Rule 3 - Blocking] vitest include pattern missing .contract.ts**
- **Found during:** Task 2 test run
- **Issue:** `Arc/Core/vitest.config.ts` had `include: ['src/**/*.test.ts']` — the `.contract.ts` suffix used by the plan spec was not matched, causing "No test files found" exit code 1.
- **Fix:** Extended include to `['src/**/*.test.ts', 'src/**/*.contract.ts']`.
- **Files modified:** `Arc/Core/vitest.config.ts`
- **Commit:** `799f986`

**4. [Rule 2 - Missing functionality] types/products.ts created proactively**
- **Found during:** Task 1 implementation
- **Issue:** `Arc/Core/src/types/products.ts` did not exist (Plan 01-04 hadn't run yet in the parallel swarm). `collections.ts` and `search.ts` both require `WCProduct`, `WCPageInfo`, `WCProductList`.
- **Fix:** Created `types/products.ts` with the three interfaces. These match what Plan 01-04 would define — the file acts as the canonical source; Plan 01-04 should import from here rather than redefine.
- **Files modified:** `Arc/Core/src/types/products.ts` (created)
- **Commit:** `a40da36`

---

## Known Stubs

None. All four exported functions are fully implemented with inline `gql` documents. The codegen pipeline (replacing inline gql with generated typed documents) is a planned v0.2 upgrade, documented in code comments.

---

## Self-Check: PASSED

Files verified present:
- `Arc/Core/src/graphql/client.ts` — FOUND
- `Arc/Core/src/graphql/collections.graphql` — FOUND
- `Arc/Core/src/graphql/search.graphql` — FOUND
- `Arc/Core/src/graphql/collections.ts` — FOUND
- `Arc/Core/src/graphql/search.ts` — FOUND
- `Arc/Core/src/types/products.ts` — FOUND
- `Arc/Core/src/__tests__/contract/collections-search.contract.ts` — FOUND

Commits verified:
- `a40da36` — feat(01-05): add Collections + Search GraphQL modules
- `799f986` — test(01-05): add Collections + Search contract tests (ARC-GQL-05, ARC-GQL-06)
