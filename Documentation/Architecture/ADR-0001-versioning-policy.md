# ADR-0001: Versioning Policy — `0.x.y` Until Customer Zero Validation

**Status:** Accepted
**Date:** 2026-05-28
**Deciders:** Arc Platform maintainers
**Phase:** Phase 0
**Related requirements:** TOOL-07, TOOL-09

## Context

Per PITFALLS P7, premature promotion to `1.0.0` of `@arc/core` would freeze the wrong API before Customer Zero (LOFT Pro Shop) has validated it in production. There is external pressure to ship a `v1` for marketing credibility, but doing so trades long-term API correctness for a short-term optics win. The Hydrogen parallel is instructive: Shopify shipped Hydrogen `0.x` through two full design iterations before 1.0 — and avoided locking the RSC patterns until the App Router was stable.

Arc's first consuming project (LOFT Pro Shop) is a private monorepo that will exercise the full `@arc/core` + `@arc/next` + `@weave/react` stack. Until that production signal exists, AND at least one external community project ships on Arc, the public API cannot be considered proven.

## Decision Drivers

- API correctness validated by real production load before it is frozen
- Customer Zero (LOFT Pro Shop) must run in production ≥90 days before v1 is viable
- Community trust: a `0.x.y` that works beats a `1.0` that breaks; consumers can opt in to pre-1.0 packages deliberately
- Ability to make breaking changes pre-1.0 without a major-version fragmentation
- Changesets already enforces per-package versioning; a CI gate can block accidental major bumps

## Considered Options

1. **Start at 1.0.0, semver strictly** — ship `@arc/core@1.0.0` immediately; breaking changes require major bumps from day one
2. **Stay at 0.x.y until LOFT prod + community site (chosen)** — minor = new features + breaking changes; patch = fixes only; 1.0.0 gated by explicit criteria
3. **Calendar versioning (e.g. 2026.05)** — avoids the pre-1.0 awkwardness but misleads consumers about stability; incompatible with semantic import maps

## Decision

All public `@arc/*` and `@weave/*` packages stay at `0.x.y` until BOTH criteria are met:

- **(a)** LOFT Pro Shop has been running in production for ≥90 days
- **(b)** At least one external community site is live on Arc

Every exported symbol carries a `@status` JSDoc tag with one of three values: `experimental`, `stable`, or `deprecated`. The tag communicates stability signal to consumers even before v1.0.

Major-version bumps (v1.0.0 or above) are gated by the `ARC_ALLOW_V1_PUBLISH=true` environment variable in CI. The `Scripts/verify-changesets-no-major.mjs` script (plan 07) blocks any changeset with `"bump": "major"` unless this variable is set. Publication is CI-only via `.github/workflows/release.yml` — no manual `npm publish`.

Changesets `fixed` groups keep `@arc/*` and `@weave/*` in lockstep so the two SDKs always share a version number.

## Consequences

### Positive

- Breaking changes pre-1.0 cost a minor bump, not a major-version fragmentation — consumers update `^0.x` and stay current without multi-major migration guides.
- Stability tags (`@status experimental | stable | deprecated`) give consumers actionable signal even during the pre-1.0 period.
- The CI gate (`ARC_ALLOW_V1_PUBLISH`) prevents accidental 1.0 promotion; the decision to go 1.0 is explicit and auditable.

### Negative

- Some enterprise adopters distrust `0.x.y` packages in production; marketing copy in `README.md` must address this directly (e.g. "production-ready at 0.x, 1.0 reserved for API stability milestone").
- Keeping `@arc/*` and `@weave/*` on the same version in `fixed` lockstep means an `@arc/core` breaking change forces a `@weave/react` minor bump even if `@weave` itself is unchanged.

### Neutral

- Signature-diff enforcement for `@stable` symbols (API Extractor / TypeDoc delta checking) is deferred to Phase 6 — Phase 0 ships the convention only; enforcement tooling comes later.
- The `@status` JSDoc convention is opt-in for documentation clarity; TypeScript does not enforce it at the type level.

## Implementation Notes

- `Scripts/verify-changesets-no-major.mjs` (plan 07) reads `.changeset/*.md` files, checks the `bump` field, and exits non-zero if any changeset contains `major` without `ARC_ALLOW_V1_PUBLISH=true` in the environment.
- `.changeset/config.json` (plan 05) sets `fixed: [["@arc/core", "@arc/next"], ["@weave/react", "@weave/next"]]` to maintain lockstep versioning.
- Every `package.json` in `Arc/` and `Weave/` starts at version `0.1.0` at Phase 1 initial publish.
- Publication runs via `.github/workflows/release.yml` (plan 06); the workflow sets `ARC_ALLOW_V1_PUBLISH` from a GitHub Actions secret to enable future 1.0 promotion.
- JSDoc `@status` tags are added to every exported symbol as part of the Phase 1-6 package authoring convention; no runtime enforcement.

## References

- Research: `.planning/research/PITFALLS.md` P7 — premature 1.0 failure mode
- Research: `.planning/phases/00-tooling-foundations/00-RESEARCH.md` Example 6 — ADR-0001 skeleton
- [API Backwards Compatibility — Zuplo](https://zuplo.com/learning-center/api-versioning-backward-compatibility-best-practices)
- [Shopify Hydrogen 0.x release history](https://github.com/Shopify/hydrogen/releases) — reference for staged versioning
