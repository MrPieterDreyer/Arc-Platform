---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: completed
last_updated: "2026-05-29T09:50:40.896Z"
progress:
  total_phases: 8
  completed_phases: 0
  total_plans: 9
  completed_plans: 4
  percent: 100
---

# Arc + Weave Platform — STATE

**Last updated:** 2026-05-28 (Plan 06 complete — CI pipeline + release workflow wired, TOOL-06 closed)

---

## Project Reference

**Core value:** A developer can ship a production headless WooCommerce storefront on `@arc/core` + `@arc/next` + `@weave/react` with the same productivity Shopify Hydrogen + Weaverse gives Shopify developers — and the page configuration lives inside the merchant's own WordPress, not a vendor SaaS.

**Current focus:** Phase 01 — arc-core

---

## Current Position

Phase: 00 (tooling-foundations) — COMPLETE
Phase: 01 (arc-core) — IN PROGRESS
Plan: 1 of TBD (Plan 01-01 complete — WooClient HTTP foundation)

- **Milestone:** v0.1 (Arc + Weave Platform v1 — Phases 0 through 6)
- **Phase:** 0 — Tooling & Foundations
- **Plan:** Planned — 9 plans across 2 waves (`.planning/phases/00-tooling-foundations/00-0{1..9}-PLAN.md`)
- **Status:** Phase 00 COMPLETE — all 9 plans done
- **Progress:** [██████████] 100%

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
| WooClientError extends Error with .code + .status — .status enables withRetry to distinguish 4xx from 5xx | 01-01 | Accepted |
| withRetry lives in http.ts (not WooClient) — separates concerns, reusable by follow-on Phase 1 agents | 01-01 | Accepted |
| WCPaymentGateway exported from store-api/checkout.ts — collocated with its function | 01-03 | Accepted |
| submitCheckout passes payment_data verbatim — no gateway token transformation (security requirement) | 01-03 | Accepted |
| Contract test uses globalThis cast for process.env — avoids @types/node in tsconfig lib (DOM-only project) | 01-03 | Accepted |

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
| 01-01 WooClient HTTP foundation | 6m | 5 | 8 |
| 01-03 Checkout module (ARC-API-05) | 5m | 2 | 5 |

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

**Last action:** Completed Phase 01 Plan 03 (Checkout module — ARC-API-05). 3 commits (`b3539a1`, `3b44106`, `050a862`). `getCheckoutSchema`, `submitCheckout`, `getPaymentGateways` functions in `src/store-api/checkout.ts`. Hand-authored checkout types in `src/types/checkout.ts`. 36 Vitest tests green (was 32). Build passes. tsc --noEmit clean. Contract tests gated behind CI_WP_ENV.

**Next action:** Phase 01 Plan 04 — customer module, or next parallel wave agent assignment.

**Files to check on resume:**

- `.planning/ROADMAP.md` — full phase structure
- `.planning/REQUIREMENTS.md` — traceability table populated
- `.planning/research/SUMMARY.md` — research synthesis with phase recommendations
- `.planning/phases/00-tooling-foundations/00-RESEARCH.md` — Phase 0 stack research
- `.planning/phases/00-tooling-foundations/00-VALIDATION.md` — Phase 0 verification contract
- `.planning/phases/00-tooling-foundations/00-0{1..9}-PLAN.md` — the 9 executable plans

---

*State initialized: 2026-05-28 · Phase 0 planning completed: 2026-05-28*
