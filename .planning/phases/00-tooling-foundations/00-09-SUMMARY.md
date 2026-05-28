---
phase: 0
plan: 09
subsystem: documentation
tags: [adr, architecture, decisions, versioning, nextjs, caching, cart, webhook, licenses]
dependency_graph:
  requires: [00-01]
  provides: [ADR-0001, ADR-0002, ADR-0003, ADR-0004, ADR-0005, ADR-0006, ADR-0007, verify-adrs]
  affects: [all-phases]
tech_stack:
  added: []
  patterns:
    - MADR (Markdown Architectural Decision Records) for all architectural decisions
    - Cache tag taxonomy pattern arc:{resource}:{key} / weave:{resource}:{key}
    - HMAC-SHA256 webhook auth pattern (mirrors GitHub webhook signature format)
key_files:
  created:
    - Documentation/Architecture/ADR-0001-versioning-policy.md
    - Documentation/Architecture/ADR-0002-nextjs-16-and-gutenberg-independence.md
    - Documentation/Architecture/ADR-0003-permitted-runtime-licenses.md
    - Documentation/Architecture/ADR-0004-cache-tag-taxonomy.md
    - Documentation/Architecture/ADR-0005-page-config-json-shape.md
    - Documentation/Architecture/ADR-0006-cart-token-cookie.md
    - Documentation/Architecture/ADR-0007-webhook-auth-mechanism.md
    - Scripts/verify-adrs.mjs
  modified:
    - package.json
decisions:
  - "ADR-0001: 0.x.y versioning lock until LOFT 90d production + 1 community site; ARC_ALLOW_V1_PUBLISH CI gate"
  - "ADR-0002: Next.js 16 + React 19 baseline; Weave editor independent of Gutenberg"
  - "ADR-0003: Runtime license allowlist — MIT/Apache-2.0/ISC/BSD-2/BSD-3/0BSD/CC0/Unlicense/BlueOak/PSF only"
  - "ADR-0004: Cache tag taxonomy — arc:product:{slug}, arc:collection:{slug}, weave:page:{slug} etc."
  - "ADR-0005: Page config JSON in post_content — schemaVersion:1, sections array, per-section version + UUIDv4 id"
  - "ADR-0006: arc_cart_token cookie — HttpOnly, SameSite=None, Secure, Path=/, Max-Age=30d"
  - "ADR-0007: HMAC-SHA256 webhook auth via X-Weave-Signature, 5-minute replay window, WEAVE_WEBHOOK_SECRET"
metrics:
  duration: "~25 minutes"
  completed_date: "2026-05-28"
  tasks_completed: 3
  files_created: 8
  files_modified: 1
---

# Phase 0 Plan 09: ADR-0001 through ADR-0007 Summary

**One-liner:** Seven architectural decision records locking versioning policy, Next.js 16 baseline, license allowlist, cache tag taxonomy, page-config JSON schema, cart cookie spec, and webhook auth — all enforced by a `verify-adrs.mjs` CI gate.

---

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | ADR-0001, ADR-0002, ADR-0003 | `f99480a` | ADR-0001 versioning, ADR-0002 Next16+Gutenberg, ADR-0003 licenses |
| 2 | ADR-0004, ADR-0005, ADR-0006, ADR-0007 | `8c77722` | ADR-0004 cache tags, ADR-0005 page config, ADR-0006 cart cookie, ADR-0007 webhooks |
| 3 | README index + verify-adrs.mjs + npm script | `aa12580` | Scripts/verify-adrs.mjs, package.json |

---

## What Was Built

### ADR-0001 — Versioning Policy
Locks all `@arc/*` and `@weave/*` packages at `0.x.y` until two explicit criteria are met: LOFT Pro Shop in production ≥90 days AND at least one external community site live on Arc. Documents the `@status experimental|stable|deprecated` JSDoc convention and the `ARC_ALLOW_V1_PUBLISH=true` CI gate that blocks accidental major-version promotion.

### ADR-0002 — Next.js 16 Baseline + Gutenberg Independence
Two coupled decisions: (a) Arc targets Next.js 16 + React 19 from v0.1, with all route loaders awaiting `params`/`searchParams` and Pilot starter using `proxy.ts` not `middleware.ts`; (b) Weave ships its own editor — no `@wordpress/blocks`, no `theme.json`, no Gutenberg dependency. The `weave_page` CPT deliberately omits `'editor'` support to prevent Gutenberg from opening Weave pages.

### ADR-0003 — Permitted Runtime Licenses
Explicit allowlist: MIT, Apache-2.0, ISC, BSD-2-Clause, BSD-3-Clause, 0BSD, CC0-1.0, Unlicense, BlueOak-1.0.0, Python-2.0. Enforced by `Scripts/check-licenses.mjs` (plan 08). PHP plugin is GPL-2.0+ (WP.org required) — accepted exception. Dev dependencies are out of scope.

### ADR-0004 — Cache Tag Taxonomy
Locked tag namespace: `arc:product:{slug}`, `arc:product:list`, `arc:collection:{slug}`, `arc:collection:list`, `arc:cart`, `weave:page:{slug}`, `weave:page:list`. Pattern `{owner}:{resource}:{key}`. Documents the typed `arcTag`/`weaveTag` helper pattern for compile-time safety in `@arc/next` and `@weave/next`.

### ADR-0005 — Page-Config JSON Shape
JSON in `post_content` of `weave_page` CPT. Root fields: `schemaVersion` (currently `1`), `slug`, `sections` (ordered array), `updatedAt`. Each section: `id` (UUIDv4), `type`, `data`, `version`. Soft limit 256KB, hard limit 1MB (413 above). Undo history is client-side only — server stores last-saved state. List endpoint returns metadata only.

### ADR-0006 — Cart-Token Cookie
Cookie name `arc_cart_token` set on the Next.js origin. Flags: `HttpOnly; SameSite=None; Secure; Path=/; Max-Age=2592000` (30 days, refreshed on each cart read). `WooClient` in `@arc/core` uses an `onCartToken` callback (framework-agnostic). `@arc/next` bridge uses `cookies().set()` / `cookies().get()`. Local dev requires HTTPS via `mkcert`.

### ADR-0007 — Webhook Auth Mechanism
HMAC-SHA256 of raw request body using shared `WEAVE_WEBHOOK_SECRET`. Header: `X-Weave-Signature: sha256=<hex>`. Timestamp header + body field for 5-minute replay window. PHP `hash_hmac()` on WP side; Node.js `crypto.createHmac()` on Next.js side. `createRevalidateHandler()` factory in `@arc/next` validates signature + timestamp + tag prefix.

### verify-adrs.mjs
`Scripts/verify-adrs.mjs` is the TOOL-09 regression gate. Checks: all 8 ADR files exist (`ADR-0001` through `ADR-0008`), each contains `## Context`, `## Decision`, `## Consequences`, and a valid `**Status:**` field. Also verifies `Documentation/Architecture/README.md` references all 8 ADRs. Exits 0 on pass, non-zero with specific error messages on failure. Run via `pnpm verify-adrs` or `node Scripts/verify-adrs.mjs`.

---

## Verification

```
$ node Scripts/verify-adrs.mjs
[verify-adrs] OK — 8 ADRs exist with required sections; index references all 8
```

```
$ ls Documentation/Architecture/ADR-000*.md
ADR-0001-versioning-policy.md
ADR-0002-nextjs-16-and-gutenberg-independence.md
ADR-0003-permitted-runtime-licenses.md
ADR-0004-cache-tag-taxonomy.md
ADR-0005-page-config-json-shape.md
ADR-0006-cart-token-cookie.md
ADR-0007-webhook-auth-mechanism.md
ADR-0008-npm-scope-decision.md
```

---

## Deviations from Plan

None — plan executed exactly as written.

The README index (`Documentation/Architecture/README.md`) was already correctly populated in plan 01 with all 8 ADR entries. No modification was needed; the verify-adrs.mjs script confirmed it passes.

---

## Known Stubs

None. All ADRs contain complete, non-placeholder content. Every decision in this plan is locked and actionable by downstream Phase 1-6 packages.

---

## Phase 0 Roadmap Success Criterion #5

> "ADR-0001 through ADR-0008 are committed to `Documentation/Architecture/` and resolve the eight decisions downstream packages will code against."

**Met.** All 8 ADRs committed with Status: Accepted. TOOL-09 gate (`verify-adrs.mjs`) exits 0.

## Self-Check: PASSED

Files verified present:
- `Documentation/Architecture/ADR-0001-versioning-policy.md` — FOUND
- `Documentation/Architecture/ADR-0002-nextjs-16-and-gutenberg-independence.md` — FOUND
- `Documentation/Architecture/ADR-0003-permitted-runtime-licenses.md` — FOUND
- `Documentation/Architecture/ADR-0004-cache-tag-taxonomy.md` — FOUND
- `Documentation/Architecture/ADR-0005-page-config-json-shape.md` — FOUND
- `Documentation/Architecture/ADR-0006-cart-token-cookie.md` — FOUND
- `Documentation/Architecture/ADR-0007-webhook-auth-mechanism.md` — FOUND
- `Scripts/verify-adrs.mjs` — FOUND

Commits verified:
- `f99480a` — docs(00-09): author ADR-0001, ADR-0002, ADR-0003
- `8c77722` — docs(00-09): author ADR-0004, ADR-0005, ADR-0006, ADR-0007
- `aa12580` — chore(00-09): add verify-adrs.mjs TOOL-09 gate + npm script
