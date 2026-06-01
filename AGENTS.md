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

## Boundaries

- **LOFT Pro Shop** lives in a separate private repo (`D:\09. LOFT Pro Shop\loft-pro-shop\`) — do not merge client code here
- **Weave Phase 2 SaaS** is out of scope until explicitly planned
- Arc + Templates packages are **MIT**; no proprietary code in public packages

## UI work

All storefront, Pilot, Template, and Weave section UI uses **`Design-Systems/Arc-Design/`**. Import tokens once at app root; do not duplicate hex values.
