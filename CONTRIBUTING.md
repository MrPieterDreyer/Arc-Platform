# Contributing to Arc Platform

Thank you for contributing to Arc — the headless WooCommerce framework and Weave visual editor SDK.

**AI agents:** read [AGENTS.md](./AGENTS.md) first — it is the canonical contract shared across all tools.

## Prerequisites

- **Node.js** ≥ 22.13 (see `engines.node` in root `package.json`)
- **pnpm** ≥ 11.4 (`corepack enable` recommended)
- **Docker** — required for live-backend contract tests (`wp-env`)
- **Git** — feature branches + PRs to `master`

## Setup

```bash
pnpm install
pnpm build
```

Optional — boot WordPress + WooCommerce for local contract tests:

```bash
pnpm wp:setup   # wp-env start + seed fixtures
pnpm test:contract
pnpm wp:stop
```

## Branch and PR workflow

1. Branch from latest `master`: `git checkout -b feat/<scope>-<short-desc>`
2. Make focused changes; use [Conventional Commits](https://www.conventionalcommits.org/)
3. Open a PR against `master`
4. Ensure CI passes (all jobs green)
5. Add a **Changeset** if you changed publishable packages (see below)
6. Get review; squash or merge per maintainer preference
7. Delete the branch after merge

### Private repo note

GitHub branch protection may require **GitHub Pro** or a public repo. Until then, enforce **PR-only merges to `master` by team policy** — no direct pushes.

### Agent worktree hygiene

If agents create `worktree-agent-*` branches or worktrees under `.claude/worktrees/`, prune stale entries after merge:

```bash
git worktree prune
git branch -d <merged-branch>
```

## Changesets

Publishable packages: `@arc/core`, `@arc/next`, `@weave/react`, `@weave/next`.

Any change that should ship to npm needs a changeset:

```bash
pnpm changeset
```

Follow [`.changeset/README.md`](./.changeset/README.md). Major bumps are blocked by CI unless `ARC_ALLOW_V1_PUBLISH=true` ([ADR-0001](./Documentation/Architecture/ADR-0001-versioning-policy.md)).

The Changesets bot opens a **Version Packages** PR when changesets accumulate on `master`. Merging that PR triggers npm publish.

## Architecture Decision Records (ADRs)

For architectural choices, add or update an ADR in `Documentation/Architecture/`:

1. Copy `ADR-template.md` → `ADR-NNNN-short-title.md`
2. Fill every section; Status = `Proposed` until merged
3. Update `Documentation/Architecture/README.md` index
4. On merge, set Status to `Accepted`

See [Documentation/Architecture/README.md](./Documentation/Architecture/README.md) for the full process.

## CI expectations

On every PR and push to `master`/`main`, CI runs:

| Job | Purpose |
|-----|---------|
| `lint` | Biome lint + format check |
| `no-next-in-core` | `@arc/core` must not depend on Next.js |
| `typecheck` | TypeScript across packages |
| `test` | Vitest (Node 22 + 24 matrix) |
| `contract` | Live wp-env backend tests |
| `license-check` | Runtime dependency license allowlist |
| `changesets-no-major` | Blocks major bumps without explicit flag |
| `verify-governance` | ADR structure + dist artifact checks |

Run locally before opening a PR:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm verify-adrs
pnpm build && pnpm verify-dist
```

## What not to commit

| Path | Reason |
|------|--------|
| `.documentation/` | GSD planning and design docs (local only) |
| `.planning/` | Legacy GSD path — gitignored; do not re-add |
| `.claude/`, `.claude-flow/`, `.swarm/`, `.cursor/`, `.trigger/` | Agent runtime state |
| `.env`, `.env.wp-test` | Secrets |
| `Artifacts/` | Generated outputs |

**Historical note:** Root `.planning/` was previously committed. It has been untracked. Git history may still contain those files until a pre-public history scrub (`git filter-repo`). Do not rely on history privacy for sensitive planning content.

If you accidentally stage ignored files:

```bash
git rm --cached -r .planning/   # example
```

## Code style

- **Biome** for lint and format (`pnpm lint`, `pnpm format:check`)
- **TypeScript strict** — no `any` without justification
- **500-line file limit** — split before crossing
- **One commit, one concern**

## Security

Report vulnerabilities per [SECURITY.md](./SECURITY.md).

## License

Arc and Weave packages are [MIT licensed](./LICENSE).
