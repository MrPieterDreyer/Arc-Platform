---
name: arc-e2e-testing
description: Build, run, and extend Arc Platform E2E tests (Playwright per app, wp-env, visual regression, a11y, payment sandbox). Produces agent-report JSON for Cursor/Claude fixes. Use when adding tests, debugging E2E failures, or implementing TESTING.md / 00-05-E2E-TESTING-SUITE prompt.
---

# Arc Platform E2E Testing

## Before any work

1. Read `Documentation/Testing/TESTING.md`
2. Read `Documentation/Testing/UX-RULES.md`
3. Read `Design-Systems/Arc-Design/SKILL.md` for UI assertions
4. Map work to `.planning/REQUIREMENTS.md` IDs — update `E2E-PRIORITIES.md`

## Implement tests (per-app)

| App | Config location |
|-----|-----------------|
| minimal-app | `Arc/Next/examples/minimal-app/playwright.config.cjs` |
| Weave WP | `Weave/WordPress/playwright.config.ts` |
| Weave Next | `Weave/Next/playwright.config.ts` |

Shared: `Scripts/e2e-shared/` (fixtures, design assertions, report builder).

## Run

```bash
pnpm wp:setup
pnpm test:e2e:smoke    # PR scope
pnpm test:e2e          # full local
```

## On failure

1. Read `Artifacts/e2e-reports/latest.json`
2. Fix tickets in severity order (P0 → P3)
3. Re-run targeted: `pnpm exec playwright test --grep "..."`
4. Update visual baselines only with intentional design change: `--update-snapshots`

## Agent output

Always write report to `Artifacts/e2e-reports/latest.json` conforming to `agent-report-schema.json`.

Each failure → one **ticket** with `suggestedFix.likelyFiles` and reproduction steps.

## Tags

`@smoke` `@regression` `@visual` `@a11y` `@perf` `@payment` `@quarantine`
