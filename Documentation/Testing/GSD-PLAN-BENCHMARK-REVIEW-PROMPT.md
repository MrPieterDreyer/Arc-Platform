# GSD Plan vs Implementation + Hydrogen/Weaverse Benchmark Review

> **Use this prompt** with Claude Code, Cursor, or any AI agent to audit Arc Platform against the GSD plan and against the LOFT Hydrogen + Weaverse Pilot baseline. Read-only unless you explicitly ask the agent to fix issues.

**Copy everything inside the fenced block below** into a new agent session as a single message.

---

## Prompt (copy from here)

```markdown
# Arc Platform — GSD plan vs implementation + Hydrogen/Weaverse benchmark

You are the lead reviewer for **Arc Platform** (`D:\00. Arc Platform`) — headless WooCommerce (`@arc/core`, `@arc/next`) and visual sections (`@weave/react`, `@weave/next`, WP plugin).

**Benchmark (read-only):** `D:\09. LOFT Pro Shop\loft-platform` — production Hydrogen + Weaverse Pilot storefront (Customer Zero). Do **not** copy LOFT code into Arc; compare for **parity, gaps, and deliberate differences** only.

This is a **read-only** audit unless I explicitly ask you to change code. Do not commit.

---

## Objective

1. Reconstruct what the **GSD plan** says should exist.
2. Compare it to **what Arc actually implements** (code, tests, CI).
3. Compare both to the **Hydrogen + Weaverse baseline** in LOFT (feature parity, DX, merchant workflows).
4. Produce one merged report with severity-ranked findings and ordered next actions.

If you can spawn parallel sub-agents, use them per domain below. If not, complete every domain yourself.

---

## Step 1 — Load sources

### Arc — planning (preferred)

- `D:\00. Arc Platform\.documentation\.planning\STATE.md`
- `D:\00. Arc Platform\.documentation\.planning\ROADMAP.md`
- `D:\00. Arc Platform\.documentation\.planning\phases/**/REQUIREMENTS.md`

If missing, use:

- `Documentation/Testing/E2E-PRIORITIES.md`, `TESTING.md`, `UX-RULES.md`
- `Documentation/Architecture/ADR-0001.md` … `ADR-0009.md`
- `AGENTS.md`, `CLAUDE.md`

### Arc — implementation

- `Arc/Core/`, `Arc/Next/`, `Arc/Next/examples/minimal-app/`
- `Weave/React/`, `Weave/Next/`, `Weave/WordPress/`
- `Scripts/e2e-shared/`, `.github/workflows/`
- `package.json`, `turbo.json`, `.changeset/`
- `git status`, `git log -15 --oneline`

### LOFT — Hydrogen + Weaverse baseline (read-only)

Read `D:\09. LOFT Pro Shop\loft-platform\CLAUDE.md` first, then:

| Area | Path |
|------|------|
| Storefront app | `LOFT Pro Shop/` (`@shopify/hydrogen`, `@weaverse/hydrogen`) |
| Routes / journeys | `LOFT Pro Shop/app/routes/` (home, products, collections, cart, search, account/*, policies) |
| Cart UX | `LOFT Pro Shop/app/components/cart/`, `app/routes/cart/` (`CartForm`, `useCart`) |
| Weaverse integration | `LOFT Pro Shop/app/weaverse/` (`components.ts`, `schema.server.ts`, `index.tsx`, `settings/*`) |
| Design tokens | `LOFT Pro Shop/app/styles/theme.css` |
| E2E | `LOFT Pro Shop/` Playwright config + specs (if present) |
| LOFT ADRs / intent | `LOFT Documentation/architecture/ADR-*.md` |

**Arc analogues to compare against:**

| LOFT (Hydrogen / Weaverse) | Arc / Weave |
|---------------------------|-------------|
| Storefront API + codegen cart | WC Store API v1 + Cart-Token (`Arc/Core`, ADR-0006) |
| `@shopify/hydrogen-react` cart hooks | Server Actions + optimistic cart (`minimal-app`) |
| Shopify Checkout | WC checkout handoff (`minimal-app/app/checkout`) |
| Customer Account API (`account/*` routes) | ADR-0009 + `/account` (session/orders partial) |
| `@weaverse/hydrogen` sections + theme settings | `@weave/react` schemas + WP-stored page config |
| Weaverse editor / Pilot theme settings | Weave WP Admin sidebar (Phase 4b, mostly scaffold) |
| Hydrogen cache / Oxygen | Next 16 `'use cache'` + `cacheTag` (ADR-0004) |
| Webhook → cache invalidation | HMAC `/api/revalidate` (ARC-NEXT-05) |

---

## Step 2 — Review domains (parallel or sequential)

### A — Arc core & Next

Verify: `ARC-NEXT-02/03/05/07`, `ARC-API-04`, ADR-0004/6/7; `@arc/core` must not import Next server APIs.

### B — Requirement coverage

Every ID in `E2E-PRIORITIES.md`; false greens/reds; `linux/` visual baselines for CI; JWT-gated account orders not on PR gate.

### C — Architecture & ADRs (Arc)

ADRs 0001–0009; Next 16 async `params`; no `unstable_cache`; package boundaries.

### D — Testing & CI (Arc)

PR vs nightly tags; workflow ↔ `package.json` script alignment; UX-RULES in E2E.

### E — Weave SDK & WP

`WEAVE-SDK-04/05/09`, `WEAVE-NEXT-01`, PHPUnit REST/webhook. **Known v0.1 deferrals (not regressions unless GSD says ship now):** `WEAVE-NEXT-04`, `WEAVE-WP-07` admin UI.

### F — Security (Arc)

Cart-Token cookies, HMAC timing-safe revalidate, section HTML safety, no secrets in CI.

### G — CI/CD & release (Arc)

Changesets for `@arc/*` / `@weave/*`; no major without `ARC_ALLOW_V1_PUBLISH`.

### H — Benchmark: Hydrogen + Weaverse vs Arc + Weave (required)

Build a **parity matrix** — not “make Arc identical to Shopify,” but “does Arc deliver equivalent *merchant/developer* outcomes?”

For each row: **LOFT evidence** | **Arc evidence** | **Parity** (`✅` / `🟡` partial / `⬜` gap / `—` N/A by design) | **Notes**

Minimum rows:

| Capability | LOFT (Hydrogen/Weaverse) | Arc/Weave target |
|------------|--------------------------|------------------|
| Route map | home, PLP, PDP, collection, search, cart, checkout, account | `minimal-app` routes + `PILOT-01` |
| Cart add/update/remove + drawer/page | `CartForm`, cart store | Server Actions + optimistic UI |
| Cart persistence across sessions | Shopify cart id / cookies | Cart-Token cookie (ADR-0006) |
| Catalog GraphQL + typed queries | Hydrogen codegen | WPGraphQL + hand types / contract tests |
| Money / image primitives | `@shopify/hydrogen-react` | Documented patterns vs components |
| Checkout | Shopify Checkout | WC native handoff (v0.1) |
| Customer login + orders | Customer Account API routes | ADR-0009 scope; JWT orders |
| Addresses / profile | `account/address/*`, dashboard | `/account`, Store API customer |
| Visual page builder | Weaverse sections + `app/weaverse/components.ts` | Weave sections + WP CPT config |
| Theme/global settings | Weaverse `settings/*` (header, cart, typography) | Weave WP meta / future Studio |
| Preview / draft | Weaverse draft/preview (if used) | `WEAVE-NEXT-03` |
| Cache invalidation on CMS save | Shopify/webhook patterns | `WEAVE-NEXT-04`, ARC-NEXT-05 |
| Section input types | Weaverse component schemas | `WEAVE-SDK-05` input matrix |
| Error isolation per section | Weaverse/Hydrogen boundaries | `WEAVE-SDK-09` |
| E2E smoke/regression | LOFT Playwright | `minimal-app/e2e/*` |
| a11y / perf budgets | LOFT quality bar (CLAUDE.md) | `@a11y`, `@perf` specs |
| Multi-tab cart sync | Hydrogen fetcher sync | `PILOT-05` |
| Payments sandbox | Shopify Payments | `PILOT-03` / `@payment` |

Also answer explicitly:

1. **What LOFT has that Arc v0.1 intentionally defers** (document why — WC vs Shopify, WP-hosted Weave vs Weaverse SaaS).
2. **What Arc is building that Hydrogen does not need** (Cart-Token, wp-env, PHP plugin, etc.).
3. **Top 5 parity gaps that block LOFT migrating from Pilot to Arc+Weave** (ordered).
4. **Top 5 things Arc already matches or exceeds** the Pilot baseline.

Cite paths on **both** sides for every non-trivial row.

---

## Step 3 — Merge & report

Deduplicate findings; separate plan drift, plan gaps, benchmark gaps, and intentional deferrals.

# GSD Plan vs Implementation — Arc Platform (+ Hydrogen/Weaverse benchmark)

**Date:** {today}  
**Arc planning source:** {path}  
**Benchmark:** `D:\09. LOFT Pro Shop\loft-platform`  
**Branch:** {branch}

## Executive summary (max 6 bullets)

## Phase / wave completion (Arc)

| Wave / phase | Verdict | Blockers |

## Coverage matrix (Arc requirements — condensed)

| Req ID | Unit | Contract | E2E | Gap? |

## Benchmark parity (Hydrogen/Weaverse → Arc/Weave)

| Capability | LOFT | Arc | Parity | Notes |

## Findings

### P0 — ship blockers

### P1 — fix before phase sign-off

### P2 — should fix soon

### P3 — nice to have

## Plan drift (built, not in GSD plan)

## Plan gaps (in GSD, not built)

## Benchmark gaps (LOFT has; Arc needs for LOFT migration)

## Intentional deferrals (documented, not bugs)

## ADR compliance summary (Arc)

## Recommended next actions (max 10, ordered: GSD + parity)

---

## Rules

- Cite file paths (Arc and LOFT) for claims; line ranges when useful.
- **Never** paste LOFT proprietary code into Arc or suggest committing LOFT files to Arc Platform.
- LOFT is WooCommerce→Shopify replatform context; Arc targets WooCommerce headless — call out **platform differences** vs true product gaps.
- Optional: `pnpm test`, `pnpm test:contract`, `pnpm test:e2e:smoke` in Arc if wp-env available.
- Do not edit either repo unless I ask in a follow-up.
```

---

## Related docs

| Doc | Purpose |
|-----|---------|
| [TESTING.md](./TESTING.md) | Test pyramid and E2E orchestration |
| [E2E-PRIORITIES.md](./E2E-PRIORITIES.md) | Requirement traceability matrix |
| [E2E-AUDIT-PROMPT.md](./E2E-AUDIT-PROMPT.md) | E2E-only completion audit |
| [AGENTS.md](../../AGENTS.md) | Agent rules and E2E gate |

## Paths reference

| Repo | Role |
|------|------|
| `D:\00. Arc Platform` | Arc + Weave framework (this repo) |
| `D:\09. LOFT Pro Shop\loft-platform` | Hydrogen + Weaverse Pilot baseline (private; read-only for reviews) |
| `loft-platform\LOFT Pro Shop\` | Weaverse Pilot storefront (`@shopify/hydrogen`, `@weaverse/hydrogen`) |
