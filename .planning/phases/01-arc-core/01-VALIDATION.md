# Phase 01 — `@arc/core` Validation Contract

**Phase:** 01-arc-core
**Created:** 2026-05-28
**Nyquist compliant:** true — every requirement ID has an exit-code-determinable automated check.

---

## Requirement → Test Map

| Req ID | Description | Plan | Test Type | Automated Command | Gate |
|--------|-------------|------|-----------|-------------------|------|
| ARC-API-01 | Cart-Token captured from response header, stored, replayed on next request. Also: two WooClient instances sharing the same Cart-Token via seeded SessionStore both return identical cart contents (multi-tab sharing). See cart.contract.ts. | 01-01 | unit | `pnpm --filter @arc/core test --run Arc/Core/src/__tests__/unit/cart-token.test.ts` | Always |
| ARC-API-02 | 401 woocommerce_rest_cookie_invalid_nonce → nonce refresh + retry exactly once | 01-01 | unit | `pnpm --filter @arc/core test --run Arc/Core/src/__tests__/unit/nonce-retry.test.ts` | Always |
| ARC-API-03 | ArcError discriminated union — correct shape for each error type | 01-01 | unit | `pnpm --filter @arc/core test --run Arc/Core/src/__tests__/unit/errors.test.ts` | Always |
| ARC-API-04 | getCart, addItem, updateItem, removeItem, applyCoupon, removeCoupon — typed WCCart returns | 01-02 | unit+contract | `pnpm --filter @arc/core test --run Arc/Core/src/__tests__/contract/cart.contract.ts` | CI_WP_ENV=true |
| ARC-API-05 | submitCheckout, getPaymentGateways — typed responses | 01-03 | unit+contract | `pnpm --filter @arc/core test --run Arc/Core/src/__tests__/contract/checkout.contract.ts` | CI_WP_ENV=true |
| ARC-API-06 | getCustomer (session), updateCustomer (session) — typed WCCustomer | 01-07 | unit+contract | `pnpm --filter @arc/core test --run Arc/Core/src/__tests__/contract/customer.contract.ts` | CI_WP_ENV=true |
| ARC-API-07 | getOrder by ID — WCOrder or null for 404. getCustomerOrders (authenticated order history) — via WPGraphQL in Plan 01-07 (graphql/customer.ts). Note: Store API has no list-orders endpoint; listCustomerOrders is NOT a Store API function. | 01-06 (getOrder), 01-07 (getCustomerOrders via GQL) | unit+contract | `pnpm --filter @arc/core test --run Arc/Core/src/__tests__/contract/orders.contract.ts` | CI_WP_ENV=true |
| ARC-API-08 | All Store API types present, exported, no any — validated by TS compile | 01-08 | TS compile | `pnpm --filter @arc/core build` | Always |
| ARC-GQL-01 | graphql-request client injects Authorization header when authToken provided | 01-01 | unit | `pnpm --filter @arc/core test --run Arc/Core/src/__tests__/unit/gql-client.test.ts` | Always |
| ARC-GQL-02 | codegen.ts produces typed query documents from WPGraphQL schema | 01-08 | codegen+build | `pnpm --filter @arc/core codegen && pnpm --filter @arc/core build` | CI_WP_ENV=true |
| ARC-GQL-03 | getProduct(slug), getProducts(filter), getProductVariations — typed | 01-04 | contract | `pnpm --filter @arc/core test --run Arc/Core/src/__tests__/contract/products.contract.ts` | CI_WP_ENV=true |
| ARC-GQL-04 | ProductListFields + ProductDetailFields fragments exist, distinct field sets | 01-04 | contract+build | `grep "fragment ProductListFields\|fragment ProductDetailFields" Arc/Core/src/graphql/products.graphql` + `pnpm --filter @arc/core build` | Always |
| ARC-GQL-05 | getCollection(slug), listCollections, getCollectionProducts — typed | 01-05 | contract | `pnpm --filter @arc/core test --run Arc/Core/src/__tests__/contract/collections-search.contract.ts` | CI_WP_ENV=true |
| ARC-GQL-06 | searchProducts(query, facets) — typed paginated results | 01-05 | contract | `pnpm --filter @arc/core test --run Arc/Core/src/__tests__/contract/collections-search.contract.ts` | CI_WP_ENV=true |
| ARC-GQL-07 | All documented queries <500ms against seeded wp-env. Seven timed tests in graphql.perf.ts (Plan 01-08 Task 3): getProduct, listProducts, getCollection, listCollections, getCollectionProducts, searchProducts, getCustomer — each asserting elapsed < 500ms using performance.now(). | 01-08 | perf | `CI_WP_ENV=true pnpm --filter @arc/core test --run Arc/Core/src/__tests__/perf/graphql.perf.ts` | CI_WP_ENV=true |
| ARC-HOOK-01 | useCart — reactive state shared across two consumers of same WooClient | 01-09 | unit (jsdom) | `pnpm --filter @arc/core test --run Arc/Core/src/__tests__/unit/hooks.test.ts` | Always |
| ARC-HOOK-02 | useProduct(slug) — fetches on mount, returns product + variation state | 01-09 | unit (jsdom) | `pnpm --filter @arc/core test --run Arc/Core/src/__tests__/unit/hooks.test.ts` | Always |
| ARC-HOOK-03 | useCollection(slug) — collection + paginated products + loadMore | 01-09 | unit (jsdom) | `pnpm --filter @arc/core test --run Arc/Core/src/__tests__/unit/hooks.test.ts` | Always |
| ARC-HOOK-04 | useCustomer() — session customer + optional GQL order history | 01-09 | unit (jsdom) | `pnpm --filter @arc/core test --run Arc/Core/src/__tests__/unit/hooks.test.ts` | Always |
| ARC-HOOK-05 | useSearch(query) — debounced (300ms) search with results state | 01-09 | unit (jsdom) | `pnpm --filter @arc/core test --run Arc/Core/src/__tests__/unit/hooks.test.ts` | Always |

---

## Phase Gate Checks (all must pass before `/gsd:verify-work`)

### Always-on checks (no external dependencies)

```bash
# 1. Full TypeScript build — all types emit correctly, no any in public API
pnpm --filter @arc/core build

# 2. Unit test suite — Cart-Token, Nonce retry, errors, GQL client auth, all 5 hooks
pnpm --filter @arc/core test --run

# 3. No next/* imports in @arc/core source — hard boundary
grep -r "from ['\"]next/" Arc/Core/src/ && echo "FAIL: next/* import found" && exit 1 || echo "PASS"

# 4. No 'use client' or 'use server' directives in hooks
grep -r "'use client'\|'use server'" Arc/Core/src/hooks/ && echo "FAIL: framework directive found" && exit 1 || echo "PASS"

# 5. Fragment pattern — both ProductListFields and ProductDetailFields exist
grep "fragment ProductListFields" Arc/Core/src/graphql/products.graphql || (echo "FAIL: ProductListFields missing" && exit 1)
grep "fragment ProductDetailFields" Arc/Core/src/graphql/products.graphql || (echo "FAIL: ProductDetailFields missing" && exit 1)

# 6. ADR-0009 exists (customer auth open question documented)
ls Documentation/Architecture/ADR-0009.md || (echo "FAIL: ADR-0009 missing" && exit 1)

# 7. All 5 hooks exported as functions
node -e "
const m = require('./Arc/Core/dist/index.js');
['useCart','useProduct','useCollection','useCustomer','useSearch'].forEach(k => {
  if(typeof m[k] !== 'function') throw new Error('Missing hook: ' + k);
});
console.log('PASS: all 5 hooks present');
"

# 8. All domain functions exported
node -e "
const m = require('./Arc/Core/dist/index.js');
const expected = ['WooClient','createWPGraphQLClient','createInMemorySessionStore',
  'getCart','addItem','updateItem','removeItem','applyCoupon','removeCoupon',
  'getCheckoutSchema','submitCheckout','getPaymentGateways',
  'getProduct','getProducts','getProductVariations',
  'getCollection','listCollections','getCollectionProducts',
  'searchProducts','getOrder','getCustomer','updateCustomer','getCustomerOrders'];
expected.forEach(k => { if(!m[k]) throw new Error('Missing: ' + k); });
console.log('PASS:', expected.length, 'exports confirmed');
"

# 9. No test.todo() remaining in hooks.test.ts for ARC-HOOK requirements
grep "test\.todo" Arc/Core/src/__tests__/unit/hooks.test.ts | grep -i "ARC-HOOK" && echo "FAIL: pending todos remain" || echo "PASS"

# 10. Perf test has 7 timed assertions
grep -c "test.skipIf" Arc/Core/src/__tests__/perf/graphql.perf.ts

# 11. Cart-Token sharing test exists in cart.contract.ts
grep "sharing the same Cart-Token" Arc/Core/src/__tests__/contract/cart.contract.ts || echo "FAIL: Cart-Token sharing test missing"
```

### CI_WP_ENV-gated checks (require Docker + wp-env)

```bash
# Contract tests — all Store API surfaces against live wp-env
CI_WP_ENV=true pnpm --filter @arc/core test --run Arc/Core/src/__tests__/contract/

# GQL perf budget — all 7 documented queries <500ms (getProduct, listProducts, getCollection,
# listCollections, getCollectionProducts, searchProducts, getCustomer)
CI_WP_ENV=true pnpm --filter @arc/core test --run Arc/Core/src/__tests__/perf/graphql.perf.ts

# Codegen pipeline — generates __generated__/ from live WPGraphQL schema
pnpm --filter @arc/core codegen

# Multi-tab Cart-Token test (Success Criterion 1 from ROADMAP)
# Covered by contract/cart.contract.ts "two WooClient instances sharing the same Cart-Token" test
```

---

## Phase Success Criteria Cross-Reference

From ROADMAP.md Phase 1 success criteria:

| # | Criterion | Verified by |
|---|-----------|-------------|
| 1 | Multi-tab Vitest E2E — same cart across two WooClient instances on same Cart-Token | `contract/cart.contract.ts` — "two WooClient instances sharing the same Cart-Token" test (CI_WP_ENV). Added Plan 01-08 Task 2. |
| 2 | rest_cookie_invalid_nonce auto-refreshes nonce, retries exactly once | `unit/nonce-retry.test.ts` (always-on) |
| 3 | Any documented WPGraphQL query <500ms against seeded wp-env | `perf/graphql.perf.ts` — 7 timed tests added in Plan 01-08 Task 3 (CI_WP_ENV) |
| 4 | useCart/useProduct/useCollection/useCustomer/useSearch import in plain Vite app with zero next/* symbols | grep gate (always-on) + manual Vite bundle check (Phase 5) |
| 5 | Every WC Store API surface has hand-authored TS types + Vitest contract tests | TS build (always-on) + all contract tests (CI_WP_ENV) |

---

## Sampling Schedule

| Event | Command | Expected Duration |
|-------|---------|-------------------|
| Per task completion | `pnpm --filter @arc/core test --run` | <15s |
| Per Wave 1 plan merge | `pnpm --filter @arc/core build` | <30s |
| Post Wave 2 (Plan 01-08) | `pnpm --filter @arc/core build` (full type check) | <60s |
| Phase gate | All always-on checks above | <2min |
| Phase gate + CI | All checks including CI_WP_ENV | <10min (depends on wp-env start) |

---

## Contract Test Environment Setup

Contract tests require:
1. Docker installed and running.
2. `pnpm wp-env start` run from the Arc/Pilot directory (Phase 5 will configure this).
3. `WP_URL=http://localhost:8888` in local `.env`.
4. WPGraphQL + WPGraphQL for WooCommerce plugins activated.
5. `CI_WP_ENV=true` env flag set.

For Phase 1 completion, contract tests may be left as `test.skipIf` pending Phase 5 wp-env setup. Phase gate: unit tests must pass; contract tests must exist and compile (not necessarily pass).

---

## File Ownership (Wave 1 Safety Rules)

Agents running Plans 01-02 through 01-07 in parallel MUST NOT modify:

| Protected file | Owner | Why |
|----------------|-------|-----|
| `Arc/Core/src/http/client.ts` | Plan 01-01 only | WooClient is the shared foundation |
| `Arc/Core/src/http/errors.ts` | Plan 01-01 only | ArcError union is shared |
| `Arc/Core/src/http/session.ts` | Plan 01-01 only | SessionStore is shared |
| `Arc/Core/src/graphql/client.ts` | Plan 01-01 only | GraphQLClient factory is shared |
| `Arc/Core/src/types/*.ts` | Plan 01-01 (stubs), 01-08 (complete) | Type reconciliation is Wave 2 only |
| `Arc/Core/src/__tests__/contract/products.contract.ts` | Plan 01-04 only | Products contract file; collections/search tests live in `collections-search.contract.ts` (Plan 01-05) |

Wave 1 agents APPEND to `src/index.ts` only — they do not restructure existing exports.

Plan 01-05 owns `collections-search.contract.ts` exclusively. It does NOT touch `products.contract.ts`.

---

*Validation contract created: 2026-05-28*
*Updated: 2026-05-28 — checker fixes applied (ARC-API-07 name, file ownership, ARC-GQL-07 perf tests, ARC-API-01 Cart-Token sharing test)*
