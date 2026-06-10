# E2E shared helpers

Imported by per-app Playwright configs (`Arc/Next/examples/minimal-app`, `Weave/WordPress`, `Weave/Next`).

## Modules

| Module | Purpose |
|--------|---------|
| `e2e-env.ts` | `E2E_*` / `WP_URL` URL resolution |
| `wp-health.ts` | Wave 0 probes (WP, GraphQL, Store API) |
| `report-builder.cjs` | Playwright reporter → `Artifacts/e2e-reports/latest.json` |
| `report-builder.ts` | TypeScript source (reference; Playwright loads `.cjs`) |
| `design-assertions.ts` | `UX-RULES.md` computed-style checks (expand in Wave 2+) |
| `webhook-sign.ts` | HMAC signing for `createRevalidateHandler` (ADR-0007) |
| `wp-cli-product.ts` | Rename seeded product via wp-env wp-cli (revalidate E2E) |
| `wp-weave-page.ts` | PUT page configs via `weave/v1` (Wave 4 render E2E) |
| `weave-input-matrix.ts` | Page config builder for 15 input types (Wave 5) |
| `store-api-checkout.ts` | Cart-Token session + GET `/checkout` draft (Wave 6); Stripe env gate |
| `store-api-customer.ts` | POST `/cart/update-customer` for Wave 7 session address E2E |
| `account-auth.ts` | JWT env gate (`TEST_JWT_TOKEN`, `E2E_CUSTOMER_JWT_TOKEN`) |
| `a11y.ts` | axe critical scan + tab-order helper (Wave 10) |
| `perf.ts` | Navigation timing budgets (Wave 11) |
| `staging-env.ts` | `E2E_ENV=staging` URL overrides (`E2E_STAGING_*` → canonical `E2E_*` / `ARC_WC_URL`) |

## Wave 7 — JWT order history (ADR-0009)

`pnpm wp:setup` does **not** install [wp-graphql-jwt-authentication](https://github.com/wp-graphql/wp-graphql-jwt-authentication). Without a JWT plugin, `TEST_JWT_TOKEN` / `E2E_CUSTOMER_JWT_TOKEN` stay unset and `e2e/account/orders.spec.ts` skips via `hasCustomerJwtEnv()`.

To run orders E2E locally:

1. Add the JWT plugin to `.wp-env.json` `plugins` (or install in wp-env manually).
2. Configure GraphQL JWT login for the seeded customer (`TEST_CUSTOMER_EMAIL` from `.env.wp-test`).
3. Export `TEST_JWT_TOKEN=<token>` before Playwright (or add to a local-only env file — never commit tokens).

Do not disable auth checks or use hardcoded tokens in the repo.

## Staging (`E2E_ENV=staging`)

Set `E2E_ENV=staging` and provide `E2E_STAGING_STOREFRONT_URL` / `E2E_STAGING_WP_URL` (and optional `E2E_STAGING_WP_APP_PASSWORD`). `getE2eEnv()` calls `applyStagingEnvOverrides()` first, mapping staging secrets onto canonical vars when unset. Used by `.github/workflows/e2e-staging.yml`.

## Weave server imports

- **`@weave-platform/next/server`** — `loadPageConfig`, revalidate handlers, `weaveTag` (no client code).
- **`@weave-platform/next/server-page`** — `WeavePage` all-in-one server component (pulls `@weave-platform/react`).

Minimal-app uses `loadPageConfig` from `./server` plus a client `SectionRenderer` wrapper — see `components/weave-page-sections.tsx`.

## Usage

```ts
import { getE2eEnv } from '../../../../Scripts/e2e-shared/e2e-env';
import { assertPrimaryCtaAccent } from '../../../../Scripts/e2e-shared/design-assertions';
```
