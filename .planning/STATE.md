---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
last_updated: "2026-06-01T11:00:00.000Z"
progress:
  total_phases: 8
  completed_phases: 3
  total_plans: 26
  completed_plans: 26
  percent: 38
---

# Arc + Weave Platform — STATE

**Last updated:** 2026-05-29 (Plan 01-09 complete — React 19 hooks layer, all 5 hooks implemented, ARC-HOOK-01..05 closed)

---

## Project Reference

**Core value:** A developer can ship a production headless WooCommerce storefront on `@arc/core` + `@arc/next` + `@weave/react` with the same productivity Shopify Hydrogen + Weaverse gives Shopify developers — and the page configuration lives inside the merchant's own WordPress, not a vendor SaaS.

**Current focus:** Phase 03 — `@weave/react` (next up). Phases 0–2 complete.

---

## Current Position

Phase: 00 (tooling) — COMPLETE
Phase: 01 (arc-core) — COMPLETE (audited + hardened 2026-06-01)
Phase: 02 (arc-next) — COMPLETE (audited + hardened 2026-06-01)
Next: Phase 03 (`@weave/react`)

- **Milestone:** v0.1 (Arc + Weave Platform v1 — Phases 0 through 6)
- **Phase:** 3 of 8 phases complete
- **Status:** Phases 0–2 done; ready to plan Phase 3
- **Progress:** [████░░░░░░] 38% (3/8 phases)

### Phase 0–2 audit (2026-06-01)

Full implementation review + fixes. `@arc/core` and `@arc/next` build, typecheck,
lint, and test green; example minimal-app builds (Next 16 cacheComponents) and its
home UI passed a 7/7 Playwright run. Key fixes:
- `ArcError` union now produced at runtime (ARC-API-03 was dead code).
- `WooClient` coupon endpoints corrected to `/cart/coupons` (were `/cart/apply-coupon`).
- Zod wired as defensive cart validation (was a declared-but-unused dep).
- `@arc/core` split into RSC-safe main barrel + `@arc/core/hooks` (client-only) — main entry no longer pulls React hooks into Server Components.
- `@arc/next` loaders build the GraphQL client INSIDE each `'use cache'` fn (closing over a client instance is illegal in Next 16).
- CI now boots wp-env + runs the contract/perf suites (were skipped → green-by-skip).
- engines.node `>=22.13` (pnpm 11 floor); CI matrix `[22,24]`.
- Empty placeholder contract tests given real bodies or removed.

### Phase 0 Plan Map

| Plan | Wave | Requirements | Depends on |
|------|------|--------------|------------|
| 01 — pnpm workspace + catalogs + ADR-0008 (npm scope) | 1 | TOOL-01 | — |
| 02 — Turborepo + Biome | 1 | TOOL-02, TOOL-08 | 01 |
| 03 — Vitest workspace | 1 | TOOL-03 | 01 |
| 09 — ADR-0001…0007 authored | 1 | TOOL-09 | 01 |
| 04 — tsup per-package builds | 2 | TOOL-04 | 01, 02, 03 |
| 05 — Changesets | 2 | TOOL-05 | 02, 03, 04 |
| 06 — CI lint/test/build pipeline | 2 | TOOL-06 | 02, 03, 04, 05 |
| 07 — Changesets major-version gate | 2 | TOOL-07 | 01, 04 |
| 08 — License allowlist gate | 2 | TOOL-10 | 01 |

Validation contract (`00-VALIDATION.md`) is `nyquist_compliant: true` — every TOOL-* requirement has an exit-code-determinable check.

---

## Performance Metrics

- **Phases complete:** 0/8
- **Plans complete:** 5/9 (Phase 0)
- **v1 requirements mapped:** 75/75
- **v1 requirements complete:** 5/75 (TOOL-01, TOOL-02, TOOL-03, TOOL-04, TOOL-05, TOOL-08)

---

## Accumulated Context

### Key Decisions (from PROJECT.md + research)

| Decision | Source | Status |
|----------|--------|--------|
| Next.js 15 → Next.js 16 upgrade | STACK §0.1 | Pending ADR-0002 |
| WC Store API v1 over CoCart | PROJECT.md | Pending ADR |
| WPGraphQL for catalog reads | PROJECT.md | Pending |
| Cart-Token + Nonce auto-managed by single `WooClient` | PITFALLS P1 | Pending ADR-0006 |
| Page configs stored in client WP CPT (not Weave SaaS) | PROJECT.md | Pending ADR-0005 |
| `0.x.y` until LOFT 90d prod + 1 community site | PITFALLS P7 | Pending ADR-0001 |
| MIT-only transitive runtime deps; CI gate | PITFALLS P14 | Pending ADR-0003 |
| Weave editor independent of Gutenberg | PITFALLS P8 | Pending ADR-0002 |
| npm scopes `@arc` and `@weave` both unclaimed → adopted | 00-01 / ADR-0008 | Accepted |
| pnpm catalogs adopted day-1 (react/next/ts/graphql/zod centralized) | 00-01 plan | Accepted |
| Dual-gate boundary: Biome noRestrictedImports + bash grep failsafe | 00-02 | Accepted |
| Exclude .claude/.swarm/.mcp.json from Biome scope (external tooling) | 00-02 | Accepted |
| arcTsup() uses regex /^@arc\\// and /^@weave\\// for externals (not string) — prevents siblings bundled | 00-04 | Accepted |
| package.json exports: types condition first in all packages (bundler resolution requirement) | 00-04 | Accepted |
| workspace:^ replaces workspace:* in sibling deps — published tarballs get caret range (Pitfall 7) | 00-04 | Accepted |
| fixed groups use glob patterns (@arc/* / @weave/*) not explicit names — forward-compatible as packages are added | 00-07 | Accepted |
| ARC_ALLOW_V1_PUBLISH=true env flag is the sole escape hatch for major bumps in CI (ADR-0001) | 00-07 | Accepted |
| turbo.json tasks key (v2) + dependsOn ^build on test + narrow inputs per task for cache correctness | 00-05 | Accepted |
| vitest --run required for all packages when invoked via turbo (prevents watch mode) | 00-05 | Accepted |
| Each CI job re-installs deps (frozen-lockfile) for isolation; Node matrix [20,22] scoped to test job only | 00-06 | Accepted |
| id-token:write permission in release.yml for npm provenance attestation (supply-chain security) | 00-06 | Accepted |
| verify-ci-workflow.mjs checks both job names and command strings to prevent silent regressions | 00-06 | Accepted |
| WooClient is framework-agnostic: fires onCartToken callback, never touches cookies directly (ADR-0006) | 01-01 | Accepted |
| useCart uses WooCart (types/woo.ts) not WCCart — matches store-api/cart.ts return type; item_count not items_count | 01-09 | Accepted |
| CartStore.getSnapshot() returns stable cached _snapshot object — required by useSyncExternalStore Object.is stability check | 01-09 | Accepted |
| WeakMap CartStore singleton — one store per WooClient instance, shared reactive cart state with no Provider boilerplate | 01-09 | Accepted |
| environmentMatchGlobs scopes jsdom to hooks.test.ts only — all other @arc/core tests stay on node environment | 01-09 | Accepted |
| WooClientError extends Error with .code + .status — .status enables withRetry to distinguish 4xx from 5xx | 01-01 | Accepted |
| withRetry lives in http.ts (not WooClient) — separates concerns, reusable by follow-on Phase 1 agents | 01-01 | Accepted |
| WCProduct/WCPageInfo/WCProductList typed in types/products.ts — catalog types distinct from Store API woo.ts types | 01-05 | Accepted |
| vitest.config.ts include extended to *.contract.ts — contract test discovery for Phase 1 GQL contract tests | 01-05 | Accepted |
| pnpm-workspace.yaml allowBuilds fixed from placeholder strings to true for esbuild + sharp (was blocking all builds) | 01-05 | Accepted |
| GraphQLClient headers factory uses Record<string,string> not object spread — required for TS strict HeadersInit compatibility | 01-05 | Accepted |
| Phase 00 P06 | 2min | 2 tasks | 4 files |
| Phase 01 P01 | 6m | 5 tasks | 8 files |
| Phase 01-arc-core P01 | 6m | 5 tasks | 8 files |
| Phase 01-arc-core P01-05 | 12m | 2 tasks | 12 files |
| Phase 01-arc-core P01-09 | 18m | 2 tasks | 9 files |
| Phase 01-arc-core P09 | 18min | 2 tasks | 9 files |

### Plan Execution Metrics

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| 00-01 pnpm + catalogs + ADR-0008 | 4m | 3 | 9 |
| 00-02 Biome 2 + no-next-in-core boundary | 6m | 2 | 4 |
| 00-03 Vitest workspace + smoke tests | 7m | 2 | 17 |
| 00-04 tsup per-package builds + TOOL-04 gate | 3m 20s | 2 | 16 |
| 00-07 Changesets major-version gate (TOOL-07) | 9m | 2 | 5 |
| 00-05 Turborepo pipeline + TOOL-05 cache contract | 4m | 2 | 7 |
| 00-06 CI pipeline + release workflow (TOOL-06) | 2m | 2 | 4 |
| 01-05 Collections + Search GraphQL modules | 12m | 2 | 12 |

### Open Todos (carried from research)

- [x] Verify npm scope availability for `@arc` / `@weave` (ADR-0008) — both verified unclaimed 2026-05-28; adopted.
- [ ] Customer auth strategy spike before Phase 1 closes (JWT vs WP session vs Store API customer endpoints).
- [ ] Stripe Payment Intents headless WC spike before Phase 5.
- [ ] postMessage contract design (message schema, origin validation, draft-mode token flow) before Phase 4b.
- [ ] WP plugin distribution decision: wp.org SVN vs GitHub-only releases.

### Blockers

None.

### Watch Items

- WPGraphQL for WooCommerce ecosystem health is MEDIUM (small bus factor; CVE-2026-33290 hit WPGraphQL core this year). Pin minor versions; document REST fallback.
- Cross-origin cart cookie deployment (`SameSite=None; Secure`) cannot be retrofitted without breaking existing carts — document in Phase 5 deployment guide.

---

## Session Continuity

**Last action:** Completed Phase 01 Plan 09 (React 19 hooks layer). 2 commits (`c2f9af9`, `1446ebe`). All 5 hooks implemented: `useCart` (WeakMap CartStore + useSyncExternalStore + useOptimistic), `useProduct`, `useCollection`, `useCustomer`, `useSearch` (debounced 300ms). 11/11 unit tests green. Build passes. ARC-HOOK-01..05 marked complete. Phase 01 arc-core is now functionally complete.

**Next action:** Phase 02 (arc-next) — Next.js 16 integration layer consuming @arc/core hooks.

**Files to check on resume:**

- `.planning/ROADMAP.md` — full phase structure
- `.planning/REQUIREMENTS.md` — traceability table populated
- `.planning/research/SUMMARY.md` — research synthesis with phase recommendations
- `.planning/phases/00-tooling-foundations/00-RESEARCH.md` — Phase 0 stack research
- `.planning/phases/00-tooling-foundations/00-VALIDATION.md` — Phase 0 verification contract
- `.planning/phases/00-tooling-foundations/00-0{1..9}-PLAN.md` — the 9 executable plans

---

*State initialized: 2026-05-28 · Phase 0 planning completed: 2026-05-28*
