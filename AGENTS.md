# Agent Instructions — Arc Platform

Canonical rules for **all** AI agents (Cursor, Claude Code, GSD, Trigger, Copilot, etc.). Human contributors should also follow [CONTRIBUTING.md](./CONTRIBUTING.md).

## Read first

1. **AGENTS.md** (this file) — git, PR, and boundary rules
2. **[CONTRIBUTING.md](./CONTRIBUTING.md)** — setup, workflow, CI
3. **[CLAUDE.md](./CLAUDE.md)** — GSD/Trigger specifics and project context
4. **[Design-Systems/Arc-Design/SKILL.md](./Design-Systems/Arc-Design/SKILL.md)** — before writing CSS or JSX

## Git rules

| Rule | Detail |
|------|--------|
| Default branch | `master` |
| Direct pushes | **Never** push directly to `master` — branch + PR |
| Branch naming | `feat\|fix\|docs\|chore/<scope>-<short-desc>` (e.g. `feat/arc-core-cart-token`) |
| Commits | Conventional Commits: `type(scope): description` |
| Granularity | One commit, one concern |
| PR-only merges | Required until branch protection is available (private repo) |

### Never commit

- `.env`, `.env.*` (except `.env.example`)
- `.documentation/` — GSD planning, design docs (local only)
- `.planning/` — **must not be re-added**; if staged by mistake, run `git rm --cached -r .planning/`
- `.claude/`, `.claude-flow/`, `.swarm/`, `.cursor/`, `.trigger/`
- `.mcp.json`, `HANDOFF.html`
- `Artifacts/` — generated outputs
- Secrets, credentials, or client-specific code from LOFT Pro Shop

### GSD planning location

- Canonical path: **`.documentation/.planning/`** (gitignored)
- If you have legacy files in root `.planning/`, move or copy them to `.documentation/.planning/` before using GSD
- Public architecture decisions belong in **`Documentation/Architecture/`** (ADRs), not planning folders

## Release rules

- Any change to publishable packages (`@arc/*`, `@weave/*`) requires a **Changeset** (see [`.changeset/README.md`](./.changeset/README.md))
- Stay on **`0.x.y`** per [ADR-0001](./Documentation/Architecture/ADR-0001-versioning-policy.md) until explicitly promoted
- Never set a **major** bump unless `ARC_ALLOW_V1_PUBLISH=true` in CI
- Publication is CI-only via Changesets — no manual `npm publish`

## Workflow routing

| Task type | Entry point |
|-----------|-------------|
| Planned phase work | GSD: `/gsd:execute-phase` |
| Small fix / doc tweak | GSD: `/gsd:quick` or Trigger: `quick-task` |
| Bug investigation | GSD: `/gsd:debug` |
| Pre-merge | CI must pass; add changeset if packages changed |

Bypass GSD workflow only when the user **explicitly** asks to skip it.

## Code conventions

- TypeScript strict throughout; no JS in source
- Files under **500 lines** — split before crossing
- **ADRs** for architectural choices: `Documentation/Architecture/ADR-*.md`
- Read before edit; match existing patterns
- No secrets in repo — `.env.example` only
- **Fail closed at request time, not import time** — security gates (webhook secrets, auth tokens, signature checks) are evaluated per-request and **reject** when their config is missing in production. Never read a secret into a module-scope constant with a fallback, and never let a missing secret silently disable verification (see [ADR-0007](./Documentation/Architecture/ADR-0007-webhook-hmac-auth.md); established by the revalidate-route fix, PR #16). Dev-only relaxations (e.g. `ARC_CART_COOKIE_SECURE=false`) must be ignored when `NODE_ENV === 'production'`.

## Boundaries

- **LOFT Pro Shop** lives in a separate private repo (`D:\09. LOFT Pro Shop\loft-pro-shop\`) — do not merge client code here
- **Weave Phase 2 SaaS** is out of scope until explicitly planned
- Arc + Templates packages are **MIT**; no proprietary code in public packages

## UI work

All storefront, Pilot, Template, and Weave section UI uses **`Design-Systems/Arc-Design/`**. Import tokens once at app root; do not duplicate hex values.

## E2E testing

Before claiming storefront, Weave, or WP plugin UI work is complete:

1. Read **`Documentation/Testing/TESTING.md`** and **`Documentation/Testing/UX-RULES.md`**
2. Run **`pnpm test:e2e:smoke`** (PR gate) and relevant suites — **`pnpm test:e2e:integration`**, **`pnpm test:e2e:catalog`**, **`pnpm test:e2e:cart`**, **`pnpm test:e2e:weave`**, **`pnpm test:e2e:checkout`**, **`pnpm test:e2e:account`** — after **`pnpm wp:setup`**. Nightly-only: **`pnpm test:e2e:visual`**, **`pnpm test:e2e:a11y`**, **`pnpm test:e2e:perf`**, or **`pnpm test:e2e:nightly`**. Use **`pnpm test:e2e:payment`** only on staging with sandbox keys (never PR gate).
3. On failure, read **`Artifacts/e2e-reports/latest.json`** and fix P0/P1 tickets before sign-off

Copy **`Documentation/Testing/cursor-rule-e2e.mdc`** to `.cursor/rules/e2e-testing.mdc` for Cursor-specific enforcement.
