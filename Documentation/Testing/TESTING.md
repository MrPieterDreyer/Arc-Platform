# Arc Platform — Testing Strategy

**Audience:** Human contributors and AI agents (Cursor, Claude Code, Trigger, GSD).  
**Scope:** This repository only (`D:\00. Arc Platform`). LOFT Pro Shop and other client repos are out of scope.  
**Goal:** Maximize confidence that Arc + Weave can ship production headless WooCommerce storefronts with merchant-owned page config in WordPress.

---

## Testing pyramid (recommended)

| Layer | Target share | Tools | When to add |
|-------|--------------|-------|-------------|
| **Unit** | ~55% | Vitest | Every function, schema, hook, loader helper |
| **Contract / API** | ~25% | Vitest + `wp-env` + PHPUnit | Store API, GraphQL, REST `weave/v1`, webhooks |
| **Integration** | ~10% | Vitest + MSW (edge cases), REST client tests | Error paths, auth, malformed payloads |
| **E2E (browser)** | ~10% growing to ~15% by Pilot | Playwright per app | User journeys, design, a11y, visual, payments |

**Rule:** Do not add E2E for logic already proven at unit/contract layer. Add E2E when a **user-visible journey** or **cross-system contract** (WP → Next → browser) must be proven.

Expand the suite each phase: map new REQUIREMENTS.md IDs to at least one automated check before marking the phase complete.

---

## Applications under test (per-app layout)

Each deployable surface owns its Playwright project. Shared helpers live under `Scripts/e2e-shared/`.

| App | Path | Playwright root | Backend |
|-----|------|-----------------|--------|
| Arc minimal storefront | `Arc/Next/examples/minimal-app/` | `e2e/` | `wp-env` + optional staging |
| Weave WP Admin (Phase 4b+) | `Weave/WordPress/` | `e2e/` | `wp-env` (`localhost:8888`) |
| Weave Next renderer (Phase 4b+) | `Weave/Next/` | `e2e/` | `wp-env` + minimal-app or weave example |
| Package-level (no browser) | `Arc/Core`, `Arc/Next`, `Weave/React` | — | Vitest contract only |

**Orchestration (repo root):**

```bash
pnpm test              # Vitest workspace (all packages)
pnpm test:contract     # Live WC + GraphQL (wp-env)
pnpm test:e2e:smoke       # PR gate — Chromium, @smoke only
pnpm test:e2e:integration # PR gate — @integration (webhook revalidate)
pnpm test:e2e:catalog     # Local / debug — Wave 2 catalog (@regression)
pnpm test:e2e:cart        # Local / debug — Wave 3 cart (@regression)
pnpm test:e2e:weave       # Local / debug — Wave 4 render + Wave 5 input matrix (@regression)
pnpm test:e2e:checkout    # Local / debug — Wave 6 checkout UI + Store API draft (@regression)
pnpm test:e2e:account     # Local / debug — Wave 7 session + JWT orders (@regression; orders skip without JWT)
pnpm test:e2e:visual      # @visual snapshots — PR job when Design-Systems/** or e2e/** change
pnpm test:e2e:a11y        # @a11y — nightly / local
pnpm test:e2e:perf        # @perf — nightly / local
pnpm test:e2e:weave-wp    # Wave 8 scaffold (@quarantine)
pnpm test:e2e:payment     # Staging / manual — @payment only (skipped without Stripe sandbox keys)
pnpm test:e2e             # Local — @smoke | @integration
pnpm test:e2e:nightly     # CI nightly — grep-invert @quarantine (incl. @visual, @a11y, @perf)
```

---

## Environments

| Environment | Use | Variables |
|-------------|-----|-----------|
| **Local `wp-env`** | Default PR smoke, contract tests, most E2E | `.env.wp-test`, `CI_WP_ENV=true` |
| **Staging** | Pre-release, payment sandbox, visual baselines | `E2E_STAGING_*` (see `.env.example`) |

Boot sequence for E2E:

```bash
pnpm wp:setup                    # Docker WP + WC + GraphQL + seed
pnpm --filter minimal-app dev    # or turbo dev target
pnpm test:e2e:smoke
```

---

## CI policy (recommended)

| Job | Trigger | Max time | Blocks merge |
|-----|---------|----------|--------------|
| `lint`, `typecheck`, `test` | Every PR | ~15 min | **Yes** |
| `contract` (wp-env) | Every PR | ~25 min | **Yes** |
| `wp-plugin` (PHPUnit matrix) | Every PR | ~20 min | **Yes** |
| `e2e-smoke` (Playwright, Chromium, `@smoke` + `@integration`) | Every PR | ~25 min | **Yes** |
| `e2e-nightly` (`test:e2e:nightly`, Chromium; incl. `@regression` catalog) | Daily `schedule` + `workflow_dispatch` | ~45 min | No (alert on failure) |
| `e2e-visual` (snapshot compare) | Nightly + PRs touching `Design-Systems/` or `**/e2e/**` | ~30 min | **Yes** on visual-diff failure |
| `e2e-staging` (payments + full journeys) | Manual `workflow_dispatch` only (`.github/workflows/e2e-staging.yml`) | ~60 min | No |

**@payment policy:** Never add `@payment` to the PR smoke/integration gate. Run `pnpm test:e2e:payment` on staging with `E2E_STRIPE_*` (or `STRIPE_*`) set. Tests skip with an explicit message when keys are absent.

**Merge gate:** All blocking jobs green. No `@quarantine` tests in the required smoke set.

**Flake policy:**

- CI: `retries: 2`, `trace: on-first-retry`, `video: retain-on-failure`
- Local: `retries: 0` by default (use `--retries=2` when debugging flakes)
- Flaky test workflow: tag `@quarantine`, file issue, remove from smoke within 48h or fix
- **Fail-hard** on `master`: quarantine suite must not exceed 5% of total tests

---

## E2E priority order (implement in this sequence)

Build depth in this order so early failures surface infrastructure problems before UI polish.

| Wave | Focus | Why first |
|------|--------|-----------|
| **0** | Health: WP up, GraphQL, Store API cart GET, Next dev/prod boot | Unblocks everything |
| **1** | **Integration spine:** webhook HMAC → `revalidateTag` → fresh PDP/page | Core platform promise |
| **2** | **Catalog:** PLP/grid, PDP, search, collection — SSR + cache tags | Revenue path |
| **3** | **Cart:** add/update/remove, `arc_cart_token` cookie, optimistic rollback | Session + UX critical |
| **4** | **Weave render:** `loadPageConfig` + `<SectionRenderer>` / `<WeavePage>` | CMS → storefront |
| **5** | **Weave input matrix** (fixture page, all 15 types) | SDK contract in browser |
| **6** | **Checkout + payments** (Stripe/PayPal sandbox) | Real money path |
| **7** | **Account:** session addresses, JWT-gated orders (`TEST_JWT_TOKEN`) | Post-purchase trust — partial until ADR-0009 |
| **8** | **WP Admin editor** (4b): list/reorder/save/media/draft preview | Merchant workflow |
| **9** | **Visual regression** (full baseline per route) | Design lock |
| **10** | **A11y** (axe on all routes + focus traps in cart/checkout) | Compliance |
| **11** | **Performance** (Lighthouse budgets on PLP/PDP/home) | Production readiness |

---

## Weave sections — recommended approach

Use a **hybrid** model (best ROI):

1. **Journey tests** — Real pages (`home`, `about`) with multi-section configs saved via REST or seed; assert order, visibility, and merchant edit → live update.
2. **Input-type matrix** — Route `/e2e-fixtures/weave-inputs` in minimal-app renders **one section per input type** with registry defaults (`e2e/weave/input-matrix.spec.ts`). Optional REST seed: `buildWeaveInputMatrixPageConfig()` → slug `e2e-weave-inputs`.
3. **Per-section tests** (Phase 5+) — When Pilot registers Hero, CTA, etc., add one happy-path + one error-boundary test per section type.

Do **not** duplicate Zod validation in E2E; trust `@weave/react` unit tests for schema edge cases.

---

## Design & UX verification

E2E must assert Arc Design tokens and commerce UX contracts:

- Read `Design-Systems/Arc-Design/SKILL.md` and `references/COMMERCE.md` before writing UI tests.
- Rule-based checks: see [UX-RULES.md](./UX-RULES.md).
- Visual regression: Playwright `toHaveScreenshot` with platform-specific baselines (`e2e/snapshots/`).
- Optional LLM review pass on failure artifacts only (screenshot + DOM summary) — see agent prompt.

---

## AI agent outputs

Every E2E run produces a machine-readable report for Cursor/Claude:

- Schema: [agent-report-schema.json](./agent-report-schema.json)
- Example: [agent-report-example.json](./agent-report-example.json)
- Consumption: agents read `Artifacts/e2e-reports/latest.json` (gitignored) and implement fixes as actionable tickets.

---

## Related docs

| Doc | Purpose |
|-----|---------|
| [wp-env-backend.md](./wp-env-backend.md) | Contract test backend |
| [E2E-PRIORITIES.md](./E2E-PRIORITIES.md) | Requirement → test mapping template |
| [UX-RULES.md](./UX-RULES.md) | Automated UX/design rules |
| [.planning/PROMPTS/00-05-E2E-TESTING-SUITE.md](../../.planning/PROMPTS/00-05-E2E-TESTING-SUITE.md) | Full agent execution prompt |
| [SKILL.md](./SKILL.md) | Agent skill (install / reference) |
| [cursor-rule-e2e.mdc](./cursor-rule-e2e.mdc) | Copy to `.cursor/rules/` locally |

---

## Future phases (extension hooks)

When adding Phase 5+ (Pilot, Templates, LOFT patterns):

1. Add `Arc/Pilot/e2e/` — copy patterns from `minimal-app/e2e/`.
2. Register new routes in `E2E-PRIORITIES.md` requirement table.
3. Extend visual baselines (never delete without review).
4. Add payment gateway matrix row if new adapter ships.

Do not collapse per-app suites into one mega-project — keep **per-app** configs importing `Scripts/e2e-shared/`.

---

## Wave 7–11 — account, WP Admin, visual, a11y, perf

| Wave | Tag | PR gate | Notes |
|------|-----|---------|-------|
| 7 Account | `@regression` | No | `/account` session billing; `/account/orders` needs `TEST_JWT_TOKEN` / `E2E_CUSTOMER_JWT_TOKEN` (ADR-0009) |
| 8 WP Admin | `@quarantine` | No | `Weave/WordPress/e2e/` — blocked until Phase 4b sidebar UI exists |
| 9 Visual | `@visual` | Optional (`e2e-visual.yml`) | Baselines under `minimal-app/e2e/snapshots/{platform}/`; Chromium only |
| 10 A11y | `@a11y` | No | `@axe-core/playwright` via `Scripts/e2e-shared/a11y.ts` |
| 11 Perf | `@perf` | No | Navigation timing proxy budgets in `Scripts/e2e-shared/perf.ts` |

**Visual baseline update:** after `pnpm wp:setup` and `pnpm --filter @arc/next-example build`, run `pnpm --filter @arc/next-example test:e2e:update-snapshots` and commit PNGs under `e2e/snapshots/{platform}/`. On Windows that is `win32/`; CI on `ubuntu-latest` needs `linux/` baselines.

**Linux baselines for CI:** trigger [`.github/workflows/e2e-update-linux-snapshots.yml`](../../.github/workflows/e2e-update-linux-snapshots.yml) (`workflow_dispatch`), download the `linux-visual-snapshots` artifact, and commit PNGs to `Arc/Next/examples/minimal-app/e2e/snapshots/linux/`. Root convenience: `pnpm test:e2e:update-snapshots`.

**Weave page rendering:** import `loadPageConfig` from `@weave/next/server` for loader-only routes, or `WeavePage` from `@weave/next/server-page` for the bundled server component.

**Perf budgets (Chromium, wp-env, v0.1):** `domContentLoadedEventEnd` ≤ 8000 ms, `loadEventEnd` ≤ 12000 ms on home / PLP / PDP. Tune in `DEFAULT_PERF_BUDGETS` when CI hardware is stable. Full Lighthouse (PILOT-06) is deferred.
