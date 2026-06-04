# E2E Suite Completion Audit Prompt

> **Use this prompt** with any AI agent or human reviewer to systematically verify the Arc Platform E2E testing implementation. Do not assume prior work is correct — verify every claim with file reads and command output.

---

## Role

You are an **E2E audit specialist** for the Arc Platform monorepo — an open-source headless WooCommerce framework (`@arc/core`, `@arc/next`) with a visual sections SDK (`@weave/react`, `@weave/next`, Weave WP plugin). Your job is to produce an evidence-based audit report, not to fix issues unless explicitly asked.

**Iron rule:** Do not mark anything PASS without evidence (file path + line reference, or command output showing green). When a test is expected to skip, verify the skip reason in spec output matches documented blockers.

---

## 1. Scope & Prerequisites

### Read first (in order)

1. `AGENTS.md` — E2E enforcement section
2. `Documentation/Testing/TESTING.md` — wave strategy and tag taxonomy
3. `Documentation/Testing/E2E-PRIORITIES.md` — P0–P3 ticket mapping
4. `Documentation/Testing/UX-RULES.md` — design assertions contract
5. `Documentation/Testing/SKILL.md` — agent workflow for failures
6. `Scripts/e2e-shared/README.md` — shared helper API
7. `.planning/PROMPTS/00-05-E2E-TESTING-SUITE.md` (if present) — original implementation spec; flag drift from reality

### Environment prerequisites

| Requirement | Verify |
|-------------|--------|
| Docker running | `docker info` succeeds |
| Node ≥20.19 or ≥22.12 | `node -v` |
| pnpm 11.x | `pnpm -v` |
| wp-env stack | `pnpm wp:setup` or documented equivalent |
| `.env.wp-test` | Exists (from seed script); no secrets committed to git |

### Branch / git state

```bash
git status
git diff --stat master...HEAD   # or main
```

Record: uncommitted E2E files, accidental `.planning/` staging, secrets in diff.

---

## 2. File Inventory Checklist

Mark each **EXISTS / MISSING / ORPHAN**. Orphan = file exists but no script, CI job, or doc references it.

### minimal-app Playwright specs (`Arc/Next/examples/minimal-app/e2e/`)

| Path | Wave | Tag(s) expected |
|------|------|-----------------|
| `smoke/health.spec.ts` | 0 | `@smoke` |
| `integration/revalidate.spec.ts` | 1 | `@integration` |
| `catalog/plp.spec.ts` | 2 | `@regression` |
| `catalog/pdp.spec.ts` | 2 | `@regression` |
| `catalog/search.spec.ts` | 2 | `@regression` |
| `catalog/collection.spec.ts` | 2 | `@regression` |
| `cart/optimistic.spec.ts` | 3 | `@regression` |
| `cart/cookie.spec.ts` | 3 | `@regression` |
| `weave/render.spec.ts` | 4 | `@regression` |
| `weave/input-matrix.spec.ts` | 5 | `@regression` |
| `weave/error-boundary.spec.ts` | 5 | `@regression` |
| `checkout/flow.spec.ts` | 6 | `@regression` |
| `checkout/api-contract.spec.ts` | 6 | `@regression` |
| `checkout/payment-sandbox.spec.ts` | 6 | `@payment` |
| `account/session.spec.ts` | 7 | `@regression` |
| `account/addresses.spec.ts` | 7 | `@regression` |
| `account/orders.spec.ts` | 7 | `@regression` or skip |
| `visual/routes.spec.ts` | 9 | `@visual` |
| `a11y/routes.spec.ts` | 10 | `@a11y` |
| `perf/routes.spec.ts` | 11 | `@perf` |

### Weave WordPress specs

| Path | Wave | Notes |
|------|------|-------|
| `Weave/WordPress/e2e/admin-sidebar.quarantine.spec.ts` | 8 | Must be `@quarantine` until Phase 4b |

### Shared infrastructure

| Path | Purpose |
|------|---------|
| `Scripts/e2e-shared/e2e-env.ts` | Typed env loader |
| `Scripts/e2e-shared/wp-health.ts` | WP/GraphQL/Store API probes |
| `Scripts/e2e-shared/webhook-sign.ts` | HMAC revalidate signing |
| `Scripts/e2e-shared/report-builder.ts` | Agent JSON report |
| `Scripts/e2e-shared/design-assertions.ts` | Arc Design token checks |
| `Scripts/e2e-shared/wp-weave-page.ts` | Weave CPT seeding |
| `Scripts/e2e-shared/weave-input-matrix.ts` | 15 input type fixtures |
| `Scripts/e2e-shared/a11y.ts` | axe wrapper |
| `Scripts/e2e-shared/perf.ts` | Navigation timing |
| `Scripts/e2e-shared/account-auth.ts` | Customer session helpers |
| `Scripts/e2e-shared/store-api-checkout.ts` | Checkout API helpers |
| `Scripts/e2e-shared/store-api-customer.ts` | Customer API helpers |
| `Scripts/e2e-shared/wp-cli-product.ts` | Product seed via wp-cli |

### Fixtures & snapshots

| Path | Notes |
|------|-------|
| `Arc/Next/examples/minimal-app/e2e-fixtures/weave-inputs/` | 15 input types |
| `Arc/Next/examples/minimal-app/e2e-fixtures/weave-errors/` | Error boundary cases |
| `Arc/Next/examples/minimal-app/e2e/snapshots/linux/` | **Required for CI visual** |
| `Arc/Next/examples/minimal-app/e2e/snapshots/win32/` | Local-only unless Windows CI |

### Documentation & agent artifacts

| Path | Purpose |
|------|---------|
| `Documentation/Testing/TESTING.md` | Strategy source of truth |
| `Documentation/Testing/E2E-PRIORITIES.md` | Severity mapping |
| `Documentation/Testing/UX-RULES.md` | UX assertion rules |
| `Documentation/Testing/SKILL.md` | Agent failure workflow |
| `Documentation/Testing/agent-report-schema.json` | Report JSON schema |
| `Documentation/Testing/agent-report-example.json` | Example report |
| `Documentation/Testing/cursor-rule-e2e.mdc` | Cursor rule template |
| `Artifacts/e2e-reports/latest.json` | Generated after test run (gitignored) |

### CI workflows

| Path | Trigger |
|------|---------|
| `.github/workflows/ci.yml` | PR — `e2e-smoke` job |
| `.github/workflows/e2e-nightly.yml` | Schedule — full suite |
| `.github/workflows/e2e-visual.yml` | PR paths — visual regression |
| `.github/workflows/e2e-staging.yml` | Manual — staging secrets |

### Root scripts (`package.json`)

Verify all exist and resolve via turbo to `@arc/next-example`:

- `test:e2e:smoke`, `:integration`, `:catalog`, `:cart`, `:weave`, `:checkout`, `:account`, `:payment`, `:visual`, `:a11y`, `:perf`, `:nightly`, `:weave-wp`, `:update-snapshots` (if documented)

### Application routes under test

Confirm pages exist in `Arc/Next/examples/minimal-app/app/`:

- `/`, `/products`, `/products/[slug]`, `/search`, `/collections/[slug]`
- `/weave/[slug]`, `/checkout`, `/account`, `/account/orders`
- `/e2e-fixtures/weave-inputs`, `/e2e-fixtures/weave-errors`

---

## 3. Wave-by-Wave Verification

For each wave: **open spec files**, **run the wave command**, **record pass/fail/skip counts**.

### Wave 0 — Smoke (`@smoke`)

**Command:** `pnpm test:e2e:smoke`

**Acceptance criteria:**

- 4 tests: WordPress reachable, GraphQL, WC Store API, Next.js home
- All pass with wp-env running
- Tagged `@smoke` for PR CI filter

**Evidence:** Playwright output + `Artifacts/e2e-reports/latest.json` if reporter wired

---

### Wave 1 — Integration (`@integration`)

**Command:** `pnpm test:e2e:integration`

**Acceptance criteria:**

- Webhook HMAC signature validated
- `revalidateTag` / cache invalidation produces fresh PDP content
- Uses `Scripts/e2e-shared/webhook-sign.ts`

---

### Wave 2 — Catalog (`@regression`)

**Command:** `pnpm test:e2e:catalog`

**Acceptance criteria:**

- PLP renders product grid with Arc Design tokens
- PDP shows title, price, add-to-cart
- Search returns results
- Collection route works
- `await connection()` or equivalent allows build without live WP

---

### Wave 3 — Cart (`@regression`)

**Command:** `pnpm test:e2e:cart`

**Acceptance criteria:**

- Optimistic cart update UI
- Cart-Token cookie persistence across navigation
- PDP add-to-cart wired to Store API
- CartHeader badge updates

---

### Wave 4 — Weave render (`@regression`)

**Command:** `pnpm test:e2e:weave` (subset: `render.spec.ts` only if matrix fails)

**Acceptance criteria:**

- `@weave/next` exports `loadPageConfig` from server entry (not deprecated `createWeaveLoaders`)
- `/weave/[slug]` renders sections from WP CPT
- `Weave/Next/src/load-page-config.ts` imports schemas without pulling `client-only` into server chain

---

### Wave 5 — Weave input matrix + error boundary

**Command:** `pnpm test:e2e:weave`

**Acceptance criteria:**

- `/e2e-fixtures/weave-inputs` covers 15 Weave input types
- `input-matrix.spec.ts` validates each type renders
- `error-boundary.spec.ts` validates graceful failure UI
- Image input default in `weave-input-matrix.ts` is `{ id: null, url: '' }` (not invalid shape)

**v0.1 partial OK if:** matrix + error-boundary pass; known skip documented

---

### Wave 6 — Checkout & payments

**Command:** `pnpm test:e2e:checkout` and `pnpm test:e2e:payment`

**Acceptance criteria (full):**

- Checkout page completes Store API flow
- `api-contract.spec.ts` validates response shapes
- `payment-sandbox.spec.ts` runs with `E2E_STRIPE_*` env (not skip)

**v0.1 partial OK if:**

- Checkout flow + API contract pass
- Payment tests **skip with explicit reason** when Stripe env absent
- Document deferral to Pilot/staging (PILOT-03)

---

### Wave 7 — Account

**Command:** `pnpm test:e2e:account`

**Acceptance criteria (full):**

- Login/session persistence
- Address CRUD
- Order history with JWT (`TEST_JWT_TOKEN`)

**v0.1 partial OK if:**

- Session + addresses pass
- `orders.spec.ts` skips pending ADR-0009 customer auth decision

---

### Wave 8 — WP Admin (BLOCKED)

**Command:** `pnpm test:e2e:weave-wp`

**Acceptance criteria:**

- Spec exists at `Weave/WordPress/e2e/admin-sidebar.quarantine.spec.ts`
- Tagged `@quarantine` — excluded from nightly pass count
- **BLOCKED** until Phase 4b sidebar UI ships

**Must NOT:** Fail nightly due to Wave 8; quarantine filter must work

---

### Wave 9 — Visual regression

**Command:** `pnpm test:e2e:visual`

**Acceptance criteria (full):**

- `routes.spec.ts` snapshots home, PLP, PDP, cart, weave page
- **`e2e/snapshots/linux/` committed** for GitHub Actions Ubuntu runners
- `e2e-visual.yml` passes on PR when design paths change

**v0.1 partial OK if:**

- Spec runs locally with win32 baselines only — flag **P1: commit linux baselines before merge**

**Generate baselines:** `pnpm test:e2e:update-snapshots` on Ubuntu

---

### Wave 10 — Accessibility

**Command:** `pnpm test:e2e:a11y`

**Acceptance criteria:**

- `@axe-core/playwright` integrated via `Scripts/e2e-shared/a11y.ts`
- Critical routes scanned; violations fail test or report P0/P1 per UX-RULES

---

### Wave 11 — Performance

**Command:** `pnpm test:e2e:perf`

**Acceptance criteria (full):** Lighthouse budgets per route

**v0.1 partial OK if:**

- Navigation timing thresholds in `perf/routes.spec.ts`
- Document Lighthouse as v0.2 upgrade

---

## 4. Shared Infrastructure Audit

### Playwright config

Locate `playwright.config.ts` in minimal-app. Verify:

- [ ] `testDir: 'e2e'`
- [ ] Projects or grep filters for tags: `@smoke`, `@integration`, `@regression`, `@visual`, `@a11y`, `@perf`, `@payment`, `@quarantine`
- [ ] `Scripts/e2e-shared` path alias or relative imports work
- [ ] Reporter writes to `Artifacts/e2e-reports/latest.json`
- [ ] `webServer` starts Next dev/build against wp-env URLs

### Tag taxonomy consistency

Grep all specs for tag usage:

```bash
rg "@smoke|@integration|@regression|@visual|@a11y|@perf|@payment|@quarantine" Arc/Next/examples/minimal-app/e2e Weave/WordPress/e2e
```

Every spec must have exactly one primary tier tag. Nightly must exclude `@quarantine`.

### Agent report schema

After any test run:

```bash
test -f Artifacts/e2e-reports/latest.json && cat Artifacts/e2e-reports/latest.json | head -50
```

Validate against `Documentation/Testing/agent-report-schema.json` (structure: summary, tickets with P0–P3, wave breakdown).

### Seed script

`Scripts/seed-wp-env.mjs` must:

- Activate Weave plugin
- Write `WEAVE_WP_BASE_URL`, `WEAVE_WP_APP_USER`, `WEAVE_WP_APP_PASSWORD`, `TEST_CUSTOMER_EMAIL`, etc. to `.env.wp-test`

---

## 5. CI/CD Audit

### PR gate (`ci.yml` → `e2e-smoke` job)

| Check | Expected |
|-------|----------|
| Runs on PR | Yes |
| Commands | `pnpm test:e2e:smoke` then `pnpm test:e2e:integration` |
| Test count | ~6 total |
| Uploads artifact | `Artifacts/e2e-reports/latest.json` |
| wp-env | Started in job or documented service container |

### Nightly (`e2e-nightly.yml`)

| Check | Expected |
|-------|----------|
| Schedule | cron (document frequency) |
| Command | `pnpm test:e2e:nightly` |
| Excludes | `@quarantine`, `@visual` (if separate job) |
| Failure notification | Document if missing |

### Visual (`e2e-visual.yml`)

| Check | Expected |
|-------|----------|
| Path filters | Design-Systems/, minimal-app e2e/visual |
| OS | `ubuntu-latest` |
| Baselines | `e2e/snapshots/linux/` |

### Staging (`e2e-staging.yml`)

| Check | Expected |
|-------|----------|
| Trigger | `workflow_dispatch` only |
| Secrets | `E2E_STAGING_*`, Stripe keys documented in TESTING.md |
| Never runs on PR | Confirmed |

### Secret hygiene

```bash
rg -i "sk_live|sk_test|password\s*=" --glob "!*.example" --glob "!.env.example" Arc/ Weave/ Scripts/ Documentation/
```

No real credentials in tracked files.

---

## 6. Documentation Alignment

| Doc claim | Verify against codebase |
|-----------|-------------------------|
| TESTING.md wave list | Spec files + scripts exist for each |
| AGENTS.md "run smoke before sign-off" | Script exists |
| AGENTS.md cursor rule copy step | `.cursor/rules/e2e-testing.mdc` exists OR flag as manual step |
| SKILL.md failure workflow | References `Artifacts/e2e-reports/latest.json` path |
| E2E-PRIORITIES.md ticket IDs | Map to spec describe blocks or report tickets |
| `.env.example` | Documents E2E vars without values |

Flag any doc that references removed APIs (`createWeaveLoaders`, `unstable_cache` in E2E context).

---

## 7. Code Quality Gates

Run in order; record exit codes:

```bash
pnpm install
pnpm wp:setup                    # if not already up
pnpm lint
pnpm typecheck
pnpm test                        # unit + contract
pnpm --filter @arc/next-example build
pnpm test:e2e:smoke
pnpm test:e2e:integration
pnpm test:e2e:nightly            # full non-quarantine suite
```

### Package publish impact

If `@weave/next` or `@weave/react` changed:

- [ ] Changeset exists in `.changeset/`
- [ ] ADR or doc note for `loadPageConfig` export

---

## 8. Security & Hygiene

| Item | Check |
|------|-------|
| `.gitignore` | `test-results/`, `playwright-report/`, `blob-report/`, `Artifacts/` |
| Never commit | `.env.wp-test`, `.planning/`, secrets |
| Quarantine pattern | Wave 8 cannot block merge |
| Skip reasons | Payment/account skips are env-gated, not silent `test.skip()` without message |

---

## 9. Partial / Blocked Acceptance for v0.1

Use this table for **merge recommendation**:

| Wave | v0.1 GO criteria | NO-GO triggers |
|------|------------------|----------------|
| 0–4 | All pass in CI smoke + nightly | Any smoke/integration failure |
| 5 | weave suite green | Image matrix type errors |
| 6 | Checkout pass; payment skip OK | Checkout flow broken |
| 7 | Session/addresses pass; orders skip OK | Login completely broken |
| 8 | Quarantined only | Quarantine leak into nightly |
| 9 | Spec exists; linux baselines **P1 if missing** | Visual job fails on every PR |
| 10 | a11y pass | P0 axe violations on home/PDP |
| 11 | perf timing pass | N/A for v0.1 |

**BLOCKED waves (8, partial 6–7)** are acceptable for v0.1 **only if** documented in audit report with ADR/ticket reference.

---

## 10. Required Output Format

Produce a structured audit report:

### Executive summary

2–3 sentences: overall readiness, test count, CI status.

### Wave scorecard

| Wave | Name | Status | Evidence |
|------|------|--------|----------|
| 0 | Smoke | PASS / PARTIAL / BLOCKED / MISSING | command output |
| … | … | … | … |

### Findings (P0–P3)

| ID | Severity | Wave | Finding | File/Command | Remediation |
|----|----------|------|---------|--------------|-------------|
| E2E-001 | P0 | … | … | … | … |

Align severity with `Documentation/Testing/E2E-PRIORITIES.md`.

### Verification command log

Paste exit codes and pass/fail/skip counts for every command run.

### Merge recommendation

One of:

- **GO** — PR CI green, nightly green, no P0/P1 open
- **GO-with-caveats** — list accepted partials (Wave 6 payment skip, Wave 7 orders skip, Wave 9 linux baselines pending)
- **NO-GO** — list blockers

### Drift from spec

If `00-05-E2E-TESTING-SUITE.md` exists, table of planned vs implemented items.

---

## Quick Smoke Audit (PR check variant)

Use when time-boxed to ~15 minutes:

```bash
git status --short
pnpm lint && pnpm typecheck
pnpm test:e2e:smoke && pnpm test:e2e:integration
test -f Documentation/Testing/TESTING.md && test -d Scripts/e2e-shared
rg -l "@smoke" Arc/Next/examples/minimal-app/e2e/smoke/
test -f .github/workflows/ci.yml && rg "test:e2e:smoke" .github/workflows/ci.yml
```

**Quick verdict:**

- **PASS** — smoke + integration green, CI job references correct scripts
- **FAIL** — any smoke/integration failure or missing CI wiring
- **FLAG** — uncommitted E2E files or missing linux visual baselines (non-blocking for PR if visual job not triggered)

---

*Prompt version: 2026-06-02 — Arc Platform E2E Waves 0–11*
