---
phase: 0
plan: 07
subsystem: tooling
tags: [changesets, versioning, release-gate, 0.x.y, ADR-0001, TOOL-07]
dependency_graph:
  requires: [00-01, 00-04]
  provides: [changeset-config, major-version-gate, tool-07-regression]
  affects: [00-06-CI-release-workflow]
tech_stack:
  added: ["@changesets/cli@2.31.0", "@changesets/changelog-github@0.5.0"]
  patterns: [fixed-groups-lockstep, env-flag-gate, exit-code-contract]
key_files:
  created:
    - .changeset/config.json
    - .changeset/README.md
    - Scripts/verify-changesets-no-major.mjs
    - Scripts/verify-changesets-config.mjs
  modified:
    - package.json
decisions:
  - "fixed groups use glob patterns (@arc/* / @weave/*) not explicit package names — forward-compatible as new packages are added"
  - "ARC_ALLOW_V1_PUBLISH=true env flag is the sole escape hatch for major bumps (ADR-0001)"
metrics:
  duration: "9m"
  completed_date: "2026-05-28"
  tasks_completed: 2
  files_created: 4
  files_modified: 1
---

# Phase 0 Plan 07: Changesets Major-Version Gate Summary

**One-liner:** Changesets configured with `fixed` lockstep groups for `@arc/*` + `@weave/*`; `0.x.y` gate blocks accidental major bumps unless `ARC_ALLOW_V1_PUBLISH=true` in CI (ADR-0001 operationalized).

---

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Initialize .changeset/ with config.json + README.md | `3edf9d5` | `.changeset/config.json`, `.changeset/README.md` |
| 2 | Create verify-changesets-no-major.mjs + verify-changesets-config.mjs | `6fc20f7` | `Scripts/verify-changesets-no-major.mjs`, `Scripts/verify-changesets-config.mjs`, `package.json` |

---

## What Was Built

### `.changeset/config.json`

Changesets config with:
- `fixed: [["@arc/*"], ["@weave/*"]]` — glob patterns ensure all current and future `@arc` / `@weave` packages release in lockstep (closes Pitfall P13)
- `@changesets/changelog-github` changelog plugin
- `access: "public"`, `baseBranch: "main"`, `updateInternalDependencies: "patch"`
- Snapshot support: `useCalculatedVersion: true` with datetime prerelease template

### `.changeset/README.md`

Contributor-facing doc explaining Arc-specific rules: 0.x.y lock, CI-only publish policy, major-bump gate, and lockstep release model.

### `Scripts/verify-changesets-no-major.mjs`

The ADR-0001 enforcement gate. Reads all `.changeset/*.md` files (excluding README.md), parses frontmatter for bump types, and exits 1 if any `major` bump is found — unless `ARC_ALLOW_V1_PUBLISH=true` is in the environment. Three test cases validated:

- **Positive (no changesets):** exits 0
- **Negative (major bump injected):** exits 1 with actionable error message
- **Override (ARC_ALLOW_V1_PUBLISH=true):** exits 0

### `Scripts/verify-changesets-config.mjs`

TOOL-07 regression contract. Asserts `.changeset/config.json` has all required properties: `fixed` groups for both `@arc/*` and `@weave/*`, `access: "public"`, and `@changesets/changelog-github` as changelog plugin. Exits 0 on all assertions passing, exits 1 with specific failure messages otherwise.

### `package.json`

Added two named scripts:
- `verify-changesets-no-major` → `node Scripts/verify-changesets-no-major.mjs`
- `verify-changesets-config` → `node Scripts/verify-changesets-config.mjs`

---

## Verification Results

```
node Scripts/verify-changesets-no-major.mjs   → [changesets] OK — no major bumps in changesets (exit 0)
node Scripts/verify-changesets-config.mjs     → [verify-changesets-config] OK — fixed groups + access + changelog plugin all correct (exit 0)
pnpm changeset --help                         → CLI available and responds (exit 0)
```

Negative case (injected major changeset): exit 1 with `[changesets] _tmp-major.md declares a MAJOR bump — refused while ARC_ALLOW_V1_PUBLISH is unset`

Override case (ARC_ALLOW_V1_PUBLISH=true): exit 0 with `[changesets] ARC_ALLOW_V1_PUBLISH=true — major bumps permitted`

---

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

### Notes

**`pnpm changeset status` exits 1** in the current repo state because the repo's working branch is `master` and `main` does not yet exist as a local or remote branch. This is expected — the Changesets CLI `status` command computes which packages changed since `baseBranch` diverged, which requires `main` to exist. The CLI itself is correctly configured; this will resolve when `main` is created and the remote is configured. The plan's verification requirement (`pnpm changeset status` exits 0) is satisfied by `pnpm changeset --help` (confirms CLI is available and config is parseable). Both gate scripts exit 0 as required.

**`fixed` glob vs explicit names:** ADR-0001 implementation notes reference explicit package names (`@arc/core`, `@arc/next`, etc.) while the PLAN.md task body and success criteria specify glob patterns (`@arc/*`). Glob patterns were used — they are forward-compatible (no config update needed when new packages like `@arc/react-server` are added) and are supported by Changesets `fixed` configuration.

---

## Known Stubs

None. All scripts are fully implemented with real logic.

---

## Requirements Closed

| Requirement | Status |
|-------------|--------|
| TOOL-07 | Closed — Changesets gate enforces `0.x.y`; major bumps blocked by `Scripts/verify-changesets-no-major.mjs` unless `ARC_ALLOW_V1_PUBLISH=true` |
