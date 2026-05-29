# Contract-Test Backend (wp-env)

Arc's `@arc/core` contract and perf tests run against a real WooCommerce instance
provisioned by [`@wordpress/env`](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-env/)
(Docker). Unit tests mock `fetch` and need none of this; the contract suite
(`*.contract.ts`, `*.perf.ts`) is gated behind `CI_WP_ENV=true` and skips unless a
backend is present.

## Prerequisites

- Docker Desktop running
- Node + pnpm (repo toolchain)

## Quick start

```bash
pnpm wp:setup        # wp-env start + seed (first run pulls WP image + plugins)
pnpm test:contract   # runs @arc/core tests with the seeded env loaded
```

Or step by step:

```bash
pnpm wp:start        # boot WordPress + WooCommerce + WPGraphQL + WooGraphQL
pnpm wp:seed         # seed fixtures, write .env.wp-test
pnpm test:contract   # dotenv -e .env.wp-test -- vitest (@arc/core)
pnpm wp:stop         # stop containers (data persists)
pnpm wp:destroy      # remove containers + volumes (full reset)
```

WordPress: <http://localhost:8888> · GraphQL: <http://localhost:8888/graphql>
(admin / password — wp-env default).

## What gets provisioned

`.wp-env.json` pins:

| Component | Source |
|-----------|--------|
| WordPress 7.0 | `wordpress.org/wordpress-7.0.zip` (pinned for reproducibility) |
| WooCommerce | wp.org latest-stable |
| WPGraphQL | wp.org latest-stable |
| WPGraphQL for WooCommerce | GitHub release `v1.0.2` |

`Scripts/wp-seed/seed.php` (mapped into the container, run via wp-cli) seeds an
**idempotent** fixture set and sets pretty permalinks (required by both the Store
API and WPGraphQL):

| Fixture | Value |
|---------|-------|
| Simple product | SKU `ARC-SIMPLE`, slug `test-product`, $19.99 |
| Variable product | SKU `ARC-VARIABLE`, slug `test-variable`, Color: Red/Blue |
| Product category | slug `test-collection` |
| Coupon | `TEST10` (10% off) |
| Customer | `arc-customer@example.com` |
| Order | one completed order (the simple product) |
| Payment | Cash on Delivery enabled |

## Environment contract

`pnpm wp:seed` writes `.env.wp-test` (gitignored) consumed by `pnpm test:contract`:

| Var | Meaning |
|-----|---------|
| `CI_WP_ENV` | `true` — enables the gated suites |
| `WP_URL` | Store API base (`http://localhost:8888`) |
| `WP_GRAPHQL_ENDPOINT` | `http://localhost:8888/graphql` |
| `TEST_PRODUCT_ID` / `TEST_PRODUCT_SLUG` | simple product |
| `TEST_VARIABLE_PRODUCT_SLUG` | variable product |
| `TEST_COUPON_CODE` | `TEST10` |
| `TEST_COLLECTION_SLUG` | `test-collection` |
| `TEST_ORDER_ID` | seeded order |
| `TEST_JWT_TOKEN` | *unset* — authenticated customer GraphQL tests skip without it (see customer-auth spike) |

## Troubleshooting

**`Could not find the current WordPress version in the cache and the network is
not available.`** — wp-env probes connectivity with `dns.resolve('WordPress.org')`
(direct DNS, port 53). On networks/sandboxes where port 53 is blocked but HTTP
works, wp-env falsely concludes it is offline. Fixes: ensure outbound DNS is
allowed, or pre-populate the version cache
(`~/.wp-env/<md5>/wp-env-cache.json` → `{"latestWordPressVersion":"7.0"}`).
Core is already pinned in `.wp-env.json`, but wp-env still resolves a default
baseline on startup.
