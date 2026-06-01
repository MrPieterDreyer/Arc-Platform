---
phase: 2
slug: arc-next
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-29
validated: 2026-06-01
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4 (workspace) |
| **Config file** | `Arc/Next/vitest.config.ts` (exists — currently smoke-only, Wave 0 extends it) |
| **Quick run command** | `pnpm --filter @arc/next test` |
| **Full suite command** | `pnpm test` (Turborepo workspace) |
| **Estimated runtime** | ~8 seconds (unit suite, mocked) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @arc/next test`
- **After every plan wave:** Run `pnpm test` (full workspace) + `pnpm --filter @arc/next build` (verify subpath exports emit)
- **Before `/gsd:verify-work`:** Full suite green + `CI_WP_ENV` integration tests green where backend available

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-xx-01 | factory | 1 | ARC-NEXT-01 | unit | `pnpm --filter @arc/next test loaders` | ✅ `loaders.test.ts` | ✅ green |
| 02-xx-02 | cookie-bridge | 1 | ARC-NEXT-02 | unit | `pnpm --filter @arc/next test cookies` | ✅ `cookies.test.ts` | ✅ green |
| 02-xx-02b | cookie-bridge | 1 | ARC-NEXT-02 | integration (skipIf) | `pnpm test:contract` | ✅ `contract/cart-token.contract.ts` | ✅ green (live wp-env, CI) |
| 02-xx-03 | cart-actions | 1 | ARC-NEXT-03 | unit | `pnpm --filter @arc/next test actions` | ✅ `actions.test.ts` | ✅ green |
| 02-xx-04 | cache-tags | 1 | ARC-NEXT-04 | unit | `pnpm --filter @arc/next test cache-tags` | ✅ `cache-tags.test.ts` | ✅ green |
| 02-xx-05 | revalidate | 2 | ARC-NEXT-05 | unit | `pnpm --filter @arc/next test revalidate` | ✅ `revalidate.test.ts` | ✅ green |
| 02-xx-05b | revalidate | 2 | ARC-NEXT-05 | integration (skipIf) | `pnpm test:contract` | ✅ `contract/revalidate.contract.ts` | ⚠️ skips (needs deployed `ARC_REVALIDATE_URL`; HMAC logic covered green by `revalidate.test.ts`) |
| 02-xx-06 | isr-config | 2 | ARC-NEXT-06 | unit | `pnpm --filter @arc/next test isr` | ✅ `isr.test.ts` | ✅ green |
| 02-xx-07 | optimistic-cart | 2 | ARC-NEXT-07 | unit (jsdom) | `pnpm --filter @arc/next test use-optimistic-cart` | ✅ `use-optimistic-cart.test.ts` | ✅ green (jsdom; also Playwright-verified in browser) |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**Coverage:** every ARC-NEXT-01..07 requirement has an automated test that runs green
(`@arc/next` unit suite: 16 passed / 2 skipped locally). In CI the live-backend
`contract` job runs the previously skip-only integration tests against a seeded
wp-env — `cart-token.contract` passes; `revalidate.contract` skips only because it
needs a deployed Next route URL (its HMAC verification is fully covered by the unit
suite). Full CI is green on `master`.

---

## Wave 0 Requirements

- [x] `Arc/Next/src/__tests__/loaders.test.ts` — ARC-NEXT-01 stubs
- [x] `Arc/Next/src/__tests__/cookies.test.ts` — ARC-NEXT-02 stubs (mock `next/headers` cookies())
- [x] `Arc/Next/src/__tests__/actions.test.ts` — ARC-NEXT-03 stubs (mock WooClient)
- [x] `Arc/Next/src/__tests__/cache-tags.test.ts` — ARC-NEXT-04 stubs (spy on cacheTag)
- [x] `Arc/Next/src/__tests__/revalidate.test.ts` — ARC-NEXT-05 stubs (spy on revalidateTag, craft HMAC signatures)
- [x] `Arc/Next/src/__tests__/isr.test.ts` — ARC-NEXT-06 stubs (snapshot constants)
- [x] `Arc/Next/src/__tests__/use-optimistic-cart.test.ts` — ARC-NEXT-07 stubs (jsdom env)
- [x] `Arc/Next/src/__tests__/contract/cart-token.contract.ts` — ARC-NEXT-02 integration (skipIf !CI_WP_ENV)
- [x] `Arc/Next/src/__tests__/contract/revalidate.contract.ts` — ARC-NEXT-05 integration (skipIf !CI_WP_ENV)
- [x] `Arc/Next/vitest.config.ts` — add `environmentMatchGlobs` for jsdom (use-optimistic-cart); extend include to `*.contract.ts`
- [x] Mock helpers for `next/headers` + `next/cache` under `Arc/Next/src/__tests__/__mocks__/`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions | Status |
|----------|-------------|------------|-------------------|--------|
| `cacheComponents: true` consumer config | ARC-NEXT-01 | Library cannot self-enable; consumer (Pilot/example app) sets it | Verify the consuming `next.config.ts` enables `cacheComponents`; confirm `'use cache'` activates | ✅ Demonstrated — the `minimal-app` example builds with "Cache Components enabled"; `@arc/next` exports `recommendedNextConfig` so consumers can't miss it |
| Cookie HttpOnly + SameSite=None+Secure in browser | ARC-NEXT-02 | Automated mocks can't verify the real browser cookie jar | DevTools → Application → Cookies; confirm `arc_cart_token` attributes after add-to-cart | ⏳ Manual (consumer/Pilot) — unit test asserts `CART_COOKIE_OPTIONS` match ADR-0006; browser attributes verified in Phase 5 |

---

## Critical Pitfalls (from Research)

1. **`cookies()`/`headers()` throw inside `'use cache'`** — cart-token reads MUST stay outside cached loader scope. Verified per Next.js 16 docs.
2. **`revalidateTag` requires `cacheLife` 2nd arg** (`revalidateTag(tag, 'max')`) — single-arg is a TS error in Next 16.
3. **`useOptimistic` only rolls back if Server Action throws** — `catch`-and-return silently breaks success criterion 4. Test must assert revert when action rejects.
4. **`arcTsup()` hardcodes single entry** — `Arc/Next/tsup.config.ts` must override `entry` for subpath exports (`@arc/next/server`, `@arc/next/client`).

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags (`vitest --run`)
- [x] Feedback latency < 10s (unit suite ~1s)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved — 2026-06-01

---

## Validation Audit 2026-06-01

State A audit. Every ARC-NEXT-01..07 requirement maps to an existing test that
runs green; the planning-time "pending/Wave 0" placeholders were reconciled to
the implemented, passing suite. No gaps required new test generation.

| Metric | Count |
|--------|-------|
| Requirements (ARC-NEXT-01..07) | 7 |
| Covered by green automated tests | 7 |
| Gaps found | 0 |
| Resolved | 0 (none needed) |
| Escalated | 0 |
| Manual-only (documented) | 2 (1 demonstrated via example app, 1 deferred to Phase 5 browser check) |

**Evidence:** `@arc/next` unit suite 16 passed / 2 skipped; CI `contract` job runs
the integration tests against a seeded wp-env (`cart-token.contract` green); full
CI green on `master` (lint, format, typecheck, license, build, test ×2, contract).
The `@arc/next` package also builds (esm+cjs+dts, subpath exports) and its UI
(optimistic cart) passed a 7/7 Playwright run in a real browser.
