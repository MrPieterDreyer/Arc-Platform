# ADR-0008: npm Scope Decision

**Status:** Accepted
**Date:** 2026-05-28
**Deciders:** Arc Platform maintainers
**Phase:** Phase 0
**Related requirements:** TOOL-09

## Context

Per `.planning/research/STACK.md` §8.4 and `.planning/research/SUMMARY.md` "Gaps to Address", the `@arc` and `@weave` scopes on npm may already be claimed. Every other ADR (0001–0007) and every published package in this monorepo references the chosen npm scope in its `name` field, import paths, and documentation examples. The scope must therefore be locked **before** any other ADR is authored — otherwise a fallback decision would require renaming every reference across the codebase and ADR set.

Existing per-package stubs already use `@arc/core`, `@arc/next`, `@weave/react`, `@weave/next` (commit `48dbc66`). If `@arc` / `@weave` turn out to be unavailable, every `name` field needs a rename pass.

## Decision Drivers

- **Scope availability on npm** — must not collide with an existing publisher
- **Short, ergonomic name** — `@arc` is one syllable; consumers type it daily
- **Parallel naming for Arc + Weave** — the two SDKs ship together; matching scope shapes (both 1-word or both 2-word) keeps docs / examples clean
- **Reversibility cost** — every later ADR cites this scope; locking now eliminates downstream churn

## Considered Options

1. **`@arc` + `@weave`** (preferred) — shortest, cleanest, parallel
2. **`@arcwoo` + `@weavewp`** (fallback) — explicit ecosystem suffix, still short
3. **`@arcframework` + `@weave-wp`** (last resort) — verbose, mixed style; only if both above are taken

## Decision

**`@arc` and `@weave` — both scopes are unclaimed on npm as of 2026-05-28.**

Verification evidence (run from `D:\00. Arc Platform`, 2026-05-28 ~14:29 UTC):

```
$ npm view @arc/core
npm error code E404
npm error 404 Not Found - GET https://registry.npmjs.org/@arc%2fcore - Not found
npm error 404  The requested resource '@arc/core@*' could not be found ...

$ npm view @arc/next
npm error code E404
npm error 404 Not Found - GET https://registry.npmjs.org/@arc%2fnext - Not found

$ npm view @arc/cli
npm error code E404
npm error 404 Not Found - GET https://registry.npmjs.org/@arc%2fcli - Not found

$ npm view @weave/react
npm error code E404
npm error 404 Not Found - GET https://registry.npmjs.org/@weave%2freact - Not found

$ npm view @weave/next
npm error code E404
npm error 404 Not Found - GET https://registry.npmjs.org/@weave%2fnext - Not found

$ npm view @weave/core
npm error code E404
npm error 404 Not Found - GET https://registry.npmjs.org/@weave%2fcore - Not found
```

`npm view <scope>` (without a package suffix) returns `EINVALIDTAGNAME` rather than a useful answer — scopes can only be probed by querying specific package names within them. The 404 responses on every probed name within both scopes constitute sufficient evidence that the scopes are unclaimed; the **first** `pnpm changeset publish` from CI will create the scope (or fail if the scope was reserved between this verification and that first publish, in which case fallback path 2 above is invoked at that time).

## Consequences

### Positive

- All `package.json` `name` fields already use `@arc/*` and `@weave/*` — no rename required
- Every example in ADR-0001..0007, READMEs, and `Documentation/` can confidently use `@arc/core`, `@arc/next`, `@weave/react`, `@weave/next` as the import paths
- Shortest, most ergonomic scope names — better DX, better marketing parity with `@shopify/hydrogen` / `@weaverse/hydrogen`

### Negative

- npm scope reservation is **not** guaranteed until first publish — a small race exists between now and the first CI publish. Mitigated by performing a no-op `pnpm pack --dry-run` in Phase 0 CI plus reserving via first changeset publish as soon as Phase 0 closes.
- Generic short scope names can occasionally attract trademark-style disputes — none expected for "arc" or "weave" but worth monitoring on the wp.org / npm side.

### Neutral

- All CI workflow filters (`changesets` `fixed` groups `["@arc/*"]` and `["@weave/*"]`) reference the chosen scope literally.

## Implementation Notes

- Per-package `name` fields stay as they are: `@arc/core`, `@arc/next`, `@weave/react`, `@weave/next` (see `Arc/Core/package.json`, `Arc/Next/package.json`, `Weave/React/package.json`, `Weave/Next/package.json`).
- Changesets config (`.changeset/config.json`, plan 05) uses `fixed: [["@arc/*"], ["@weave/*"]]`.
- The `.github/workflows/release.yml` (plan 06) is the first publish surface — it will trigger npm scope creation on the first `changeset publish` invocation.
- If the scope IS taken at first publish time (the small race window above), the fallback decision is to rename to `@arcwoo/*` and `@weavewp/*`. That decision would supersede this ADR and require a follow-up rename PR touching every package and import path. Document in a new ADR-0009 if it happens.
- Plan 09 (ADR-0001..0007 authoring) uses `@arc/*` and `@weave/*` import paths verbatim in every example.

## References

- `.planning/research/STACK.md` §8.4 — scope availability flag
- `.planning/research/SUMMARY.md` — "Gaps to Address" / npm scope open question
- `.planning/phases/00-tooling-foundations/00-RESEARCH.md` — Open Question #1, Pitfall 8
- npm scope verification, 2026-05-28: `npm view @arc/{core,next,cli}` and `npm view @weave/{react,next,core}` all return E404
- [npm scopes docs](https://docs.npmjs.com/cli/v10/using-npm/scope)
