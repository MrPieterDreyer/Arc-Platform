---
phase: 1
plan: 07
subsystem: arc-core
tags: [customer, store-api, graphql, wpgraphql, graphql-request, contract-tests, adr]
dependency_graph:
  requires: [01-01-woo-client]
  provides: [getCustomer, updateCustomer, getCustomerOrders, createWPGraphQLClient, WCCustomer, WCCustomerOrdersResult, ADR-0009]
  affects: [01-arc-next-customer-auth, weave-hooks-useCustomer]
tech_stack:
  added:
    - "graphql-request@^7.4.0 (catalog + @arc/core dep) — WPGraphQL HTTP client"
    - "graphql@^16.14.0 (catalog peer, now direct dep in @arc/core)"
  patterns:
    - "Session-scoped Store API customer (GET/POST /customer) — no auth required, Cart-Token session"
    - "Authenticated WPGraphQL customer query — GraphQLClient with requestMiddleware for Bearer injection"
    - "createWPGraphQLClient factory — framework-agnostic, authToken callback deferred to @arc/next"
    - "Contract tests gated behind CI_WP_ENV=true — skip cleanly in unit CI"
key_files:
  created:
    - Arc/Core/src/types/customer.ts
    - Arc/Core/src/store-api/customer.ts
    - Arc/Core/src/graphql/client.ts
    - Arc/Core/src/graphql/customer.graphql
    - Arc/Core/src/graphql/customer.ts
    - Arc/Core/src/__tests__/contract/customer.contract.test.ts
    - Documentation/Architecture/ADR-0009.md
  modified:
    - Arc/Core/src/index.ts
    - Arc/Core/package.json
    - pnpm-workspace.yaml
decisions:
  - "getCustomer is session-scoped only — JSDoc explicitly warns it is NOT a full customer profile and links to getCustomerOrders"
  - "getCustomerOrders throws on null customer (unauthenticated) rather than returning null — callers get a clear error with remediation hint"
  - "createWPGraphQLClient uses requestMiddleware (not dynamic headers) for auth injection — compatible with graphql-request v7 API"
  - "ADR-0009 status is Open — customer auth strategy (JWT vs App Passwords vs cookie bridge) deferred to Phase 2 spike"
  - "Contract test file renamed to .contract.test.ts to match vitest include: src/**/*.test.ts pattern"
metrics:
  duration: "~8m"
  completed_date: "2026-05-29"
  tasks_completed: 2
  files_created: 7
  files_modified: 3
---

# Phase 1 Plan 07: Customer Module — Store API + WPGraphQL Summary

**One-liner:** Session-scoped Store API customer functions (`getCustomer`/`updateCustomer`) plus authenticated WPGraphQL order history (`getCustomerOrders`) via `createWPGraphQLClient` factory, with ADR-0009 documenting the customer auth open question for Phase 2.

---

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Store API customer + GQL client + GQL customer modules | `f27f461` | `src/types/customer.ts`, `src/store-api/customer.ts`, `src/graphql/client.ts`, `src/graphql/customer.graphql`, `src/graphql/customer.ts`, `src/index.ts` |
| 2 | Customer contract tests + ADR-0009 stub | `ac75d33` | `src/__tests__/contract/customer.contract.test.ts`, `Documentation/Architecture/ADR-0009.md` |

---

## What Was Built

### `Arc/Core/src/types/customer.ts`
`WCCustomerAddress` and `WCCustomer` types for the WC Store API `/customer` endpoint. File-level comment warns that this is session-scoped data only (no order history).

### `Arc/Core/src/store-api/customer.ts`
Two session-scoped Store API functions:
- `getCustomer(client)` — GET /customer, returns session billing/shipping. JSDoc explicitly warns it is NOT a full profile and points to `getCustomerOrders()` for order history.
- `updateCustomer(client, patch)` — POST /customer with `WCCustomerPatch`. No auth required — uses Cart-Token session.

### `Arc/Core/src/graphql/client.ts`
`createWPGraphQLClient(config)` factory — framework-agnostic `GraphQLClient` factory that injects `Authorization: Bearer {token}` via `requestMiddleware` when `authToken()` returns a non-null value. No `next/*` imports.

### `Arc/Core/src/graphql/customer.graphql`
`GetCustomerOrders` query — fetches customer identity fields + paginated orders with line items. Comments clarify auth token requirement.

### `Arc/Core/src/graphql/customer.ts`
`getCustomerOrders(client, vars?)` — requests the `GetCustomerOrders` document, throws with a descriptive error if `customer` is null (unauthenticated). Exports `WCGQLOrderLineItem`, `WCGQLOrder`, `WCCustomerOrdersResult`.

### `Documentation/Architecture/ADR-0009.md`
MADR-format stub. Status: Open. Documents the three customer auth options (JWT, Application Passwords, cookie bridge) and defers the decision to a Phase 2 spike.

### Verification

```
$ npx tsup (from Arc/Core/)
ESM  dist/index.mjs     8.33 KB
CJS  dist/index.js      8.59 KB
DTS  dist/index.d.ts    14.09 KB
Build success in 499ms

$ npx vitest run src/__tests__/contract/customer.contract.test.ts
Test Files  1 skipped (1)
     Tests  4 skipped (4)

$ grep "next/" src/store-api/customer.ts src/graphql/customer.ts
(no output — PASS)
```

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Contract test file extension mismatch**
- **Found during:** Task 2 verification
- **Issue:** Plan spec named the file `customer.contract.ts`. The vitest config uses `include: ['src/**/*.test.ts']` so the file was not picked up.
- **Fix:** Renamed to `customer.contract.test.ts` — the `.test.ts` suffix is already the project convention.
- **Files modified:** `Arc/Core/src/__tests__/contract/customer.contract.test.ts`
- **Commit:** `ac75d33`

**2. [Rule 2 - Missing critical functionality] Null customer guard in getCustomerOrders**
- **Found during:** Task 1 implementation
- **Issue:** WPGraphQL returns `{ customer: null }` (not an error) for unauthenticated requests. Without a null check, callers would receive `undefined` silently.
- **Fix:** Added explicit null check that throws with a descriptive error message pointing to `createWPGraphQLClient({ authToken: ... })`.
- **Files modified:** `Arc/Core/src/graphql/customer.ts`
- **Commit:** `f27f461`

---

## Known Stubs

None. All exported APIs are fully implemented. The `authToken` source (JWT vs Application Passwords) is intentionally deferred to Phase 2 — this is not a stub but an architectural open question documented in ADR-0009.

---

## Self-Check: PASSED

Files verified present:
- `Arc/Core/src/types/customer.ts` — FOUND
- `Arc/Core/src/store-api/customer.ts` — FOUND
- `Arc/Core/src/graphql/client.ts` — FOUND
- `Arc/Core/src/graphql/customer.graphql` — FOUND
- `Arc/Core/src/graphql/customer.ts` — FOUND
- `Arc/Core/src/__tests__/contract/customer.contract.test.ts` — FOUND
- `Documentation/Architecture/ADR-0009.md` — FOUND

Commits verified:
- `f27f461` — feat(01-07): add customer Store API + GraphQL modules
- `ac75d33` — feat(01-07): add customer contract tests + ADR-0009 stub
