# ADR-0003: Permitted Runtime Dependency Licenses

**Status:** Accepted
**Date:** 2026-05-28
**Deciders:** Arc Platform maintainers
**Phase:** Phase 0
**Related requirements:** TOOL-10, TOOL-09

## Context

Arc (`@arc/core`, `@arc/next`) and Weave (`@weave/react`, `@weave/next`) and `Templates/*` are published under the MIT license. This MIT promise to consumers means they can use the packages in any project — open source, commercial, proprietary — without restriction.

Per PITFALLS P14, a transitive runtime dependency carrying a GPL, LGPL, AGPL, or SSPL license would arguably contaminate the MIT promise. While the legal boundary between "linking" and "bundling" in Node.js ecosystems is debated, the risk is real enough that enterprise adopters will be blocked by their legal teams if any transitive dep appears in a copyleft license scan. npm has no built-in enforcement mechanism.

The Weave WP PHP plugin is published under GPL-2.0+ (mandatory for WordPress.org plugin directory listing). This is an accepted and expected exception — the PHP side is a WP plugin, not an npm package, and GPL is the standard license for WP plugins. The JS packages compiled by `@wordpress/scripts` inside the plugin must still avoid bundling GPL JS deps.

## Decision Drivers

- Maintain the MIT promise for all npm packages: consumers must be able to use Arc + Weave in commercial and proprietary projects
- Automated enforcement: humans reviewing licenses per-PR is error-prone; CI gate is the only reliable mechanism
- Permissive ecosystem only: avoid all copyleft licenses in runtime deps
- New transitive deps must not silently slip in unlicensed or copyleft packages

## Considered Options

1. **No enforcement (rely on manual review per-PR)** — free-form; relies on reviewer knowledge; copyleft packages can slip in silently via transitive deps; fails enterprise legal review
2. **Permissive allowlist enforced in CI (chosen)** — explicit allowlist; CI blocks non-permitted licenses; adding a new license requires an explicit ADR amendment; enterprise-safe
3. **GPL-compatible allowlist** — allows LGPL and some MPL packages; broader dep access but compromises the MIT promise for commercial users; creates legal grey zone

## Decision

Runtime production dependencies of `@arc/*`, `@weave/*` JS packages, and `Templates/*` must be licensed under one of the following:

| License | SPDX ID |
|---------|---------|
| MIT | `MIT` |
| Apache 2.0 | `Apache-2.0` |
| ISC | `ISC` |
| BSD 2-Clause | `BSD-2-Clause` |
| BSD 3-Clause | `BSD-3-Clause` |
| Zero-Clause BSD | `0BSD` |
| Creative Commons Zero | `CC0-1.0` |
| Unlicense | `Unlicense` |
| Blue Oak 1.0.0 | `BlueOak-1.0.0` |
| Python Software Foundation 2.0 | `Python-2.0` |
| Creative Commons Attribution 4.0 | `CC-BY-4.0` |
| MIT No Attribution | `MIT-0` |
| Apache 2.0 + LGPL 3.0+ (native binary only) | `Apache-2.0 AND LGPL-3.0-or-later` |

This allowlist applies to **runtime production dependencies and their transitive closure** — packages that appear in `dependencies` (not `devDependencies` or `peerDependencies`) of any published package.

**Justification for the final three entries** (added 2026-06-04 to bring this ADR into sync with the already-validated state of `Scripts/check-licenses.mjs` — see Changelog):

- **`CC-BY-4.0`** — carried by `caniuse-lite` (browser-compatibility data consumed transitively). This is a *data* license attached to a dataset, not a code license that copyleft-contaminates Arc's MIT source. The CC-BY attribution requirement applies to the data only and does not reach Arc's code.
- **`MIT-0`** (MIT No Attribution) — strictly *more* permissive than MIT (it drops even the attribution requirement). Appears via `@csstools/*` transitives of `@wordpress/*`. If MIT is permitted, MIT-0 is permitted a fortiori.
- **`Apache-2.0 AND LGPL-3.0-or-later`** — reported for `@img/sharp-*` platform binaries pulled in transitively by Next.js's image optimizer. The LGPL covers the **bundled `libvips` native binary**, not Arc's MIT code, and Arc's *published* packages (`@arc/core`, `@arc/next`) do not depend on `sharp` — it arrives via the consumer's `next` install or the private example app. This native-binary boundary keeps the LGPL copyleft from reaching Arc's MIT code (the same boundary rationale `check-licenses.mjs` applies to the `@wordpress/*` GPL exception).

The CI gate is `Scripts/check-licenses.mjs` (plan 08), which runs `pnpm licenses list --prod --json` and validates every entry against this allowlist. The `pnpm license-check` npm script in the root `package.json` is the entry point.

**Accepted exceptions:**
- `Weave/WordPress/` (PHP plugin) — GPL-2.0+ is required for WP.org directory; accepted and expected; out of scope for this gate
- Dev-only dependencies (`devDependencies`) — not checked; tooling like Biome, Vitest, tsup may carry any OSI-approved license

## Consequences

### Positive

- MIT promise is enforceable and auditable: enterprise legal teams can run `pnpm license-check` and get a pass/fail result
- Downstream commercial users of `@arc/*` and `@weave/*` have legal clarity; no copyleft surprise in transitive deps
- CI gate catches violations before merge — no human review dependency

### Negative

- Cannot use GPL-licensed JS utilities (some popular utility libraries are GPL or LGPL-only); contributors must find permissive alternatives
- Adding a new license to the allowlist requires amending BOTH this ADR AND `Scripts/check-licenses.mjs` in the same PR — intentional friction that forces explicit team review
- Some packages publish under dual license (e.g. MIT + GPL); `pnpm licenses list` may report the stricter option — those packages need manual annotation in the check script

### Neutral

- License gate runs in CI only (not as a pre-commit hook) — developers are not blocked locally during exploration phases
- `peerDependencies` are not checked because peer deps are the consumer's responsibility; only the packages Arc + Weave directly bundle are in scope

## Implementation Notes

- `Scripts/check-licenses.mjs` (plan 08) implements this allowlist verbatim. The allowed SPDX IDs array in that script must match this ADR exactly.
- To add a license to the allowlist: open a PR that edits **both** this ADR (allowlist table above) and `Scripts/check-licenses.mjs` (the `ALLOWED` constant). PRs that edit one without the other must be rejected.
- `pnpm license-check` (root `package.json` script alias) is the CI command. The GitHub Actions job (plan 06) runs this in the lint phase.
- Packages that report `UNLICENSED` or missing `license` field in their `package.json` are treated as violations — they must be resolved (typically by contacting the maintainer or switching to an alternative).

## Changelog

- **2026-06-04** — Added `CC-BY-4.0`, `MIT-0`, and `Apache-2.0 AND LGPL-3.0-or-later` to the permitted-licenses table to bring this ADR into sync with the validated state of `Scripts/check-licenses.mjs`. The script already allowed (and justified, via inline comments) these three SPDX IDs; this amendment is a one-directional reconciliation that documents the script's existing, legitimate entries. The script was NOT modified — trimming it would have reintroduced real license drift for `caniuse-lite`, `@img/sharp-*`, and the `@csstools/*`/`@wordpress/*` transitives. The "edit ADR table and script together" rule (see Implementation Notes) remains in force for all future changes.

## References

- Research: `.planning/research/PITFALLS.md` P14 — GPL contamination risk
- Research: `.planning/research/SUMMARY.md` — "License allowlist" decision entry
- [pnpm licenses list CLI](https://pnpm.io/cli/licenses)
- [SPDX License List](https://spdx.org/licenses/)
- [Open Source Initiative — Licenses by Category](https://opensource.org/licenses/category)
