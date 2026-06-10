# ADR-0012 — Supply-Chain Hardening

**Status:** Accepted (2026-06-09; proposed 2026-06-08 — surfaced by Hydrogen/Weaverse parity audit)
**Date:** 2026-06-08
**Deciders:** Pieter Dreyer

## Context

The parity audit (`AUDIT-hydrogen-weaverse-parity-2026-06-08.html`, Supply-chain section) found Arc/Weave's
release-governance baseline **strong** — `pnpm license-check` in CI, `--frozen-lockfile` everywhere, fixed
Changeset groups, pnpm catalogs, a real `SECURITY.md`. Three gaps are nonetheless **release-integrity
blockers** that must close before the first public npm publish, plus a few P2 hygiene items.

Blockers (all P1):
1. **No npm provenance.** `id-token: write` is declared (`release.yml:15`) but `pnpm changeset publish`
   runs without `--provenance` and still passes a static `NPM_TOKEN` (`release.yml:37-41`). Consumers
   cannot run `npm audit signatures`. Hydrogen uses OIDC Trusted Publishing with `NPM_TOKEN: ''`.
2. **GitHub Actions pinned to mutable tags.** `actions/checkout@v4`, `pnpm/action-setup@v4`,
   `changesets/action@v1`, `shivammathur/setup-php@v2` across all workflows. A repointed tag on a
   compromised action injects code into the release pipeline — the highest-value supply-chain target.
   Hydrogen SHA-pins every action.
3. **No WPGraphQL version floor.** Weave depends on WPGraphQL + WPGraphQL-for-WooCommerce at runtime but
   declares no minimum version anywhere (`weave.php:1-13`). CVE-2026-33290 is a known WPGraphQL
   vulnerability class; a merchant can install Weave atop a vulnerable version with no warning.

P2 hygiene:
- `composer.json:15` pins `php-stubs/wordpress-stubs: "*"` (wildcard — any future major resolves silently).
- Dependabot has no `composer` ecosystem entry, so PHP deps get no automated CVE/update PRs
  (`dependabot.yml:1-19`).
- Root `@wordpress/env: "^10.17.0"` and `dotenv-cli: "^8.0.0"` use caret yet run in CI (`package.json:58-59`).
- `jsdom` drifts across packages (`^26.1.0` vs `^29.1.1`).

## Decision

**Proposed:** Adopt the following as the supply-chain hardening baseline, sequenced P1-first.

1. **npm OIDC Trusted Publishing + `--provenance`.** Register `@arc/*` and `@weave/*` packages for OIDC on
   npmjs.com; change the publish step to `pnpm changeset publish --provenance` and set `NPM_TOKEN: ''` so
   the static token is removed and Sigstore attestation is forced. `SECURITY.md`'s "verify provenance"
   note becomes truthful once this lands.
2. **SHA-pin all third-party GitHub Actions** in `ci.yml` and `release.yml`, each with a `# vX.Y.Z` comment.
   The already-configured `github-actions` Dependabot ecosystem (`dependabot.yml:14-19`) manages SHA bumps.
3. **Declare the WPGraphQL dependency floor.** Add `Requires Plugins: wp-graphql, wp-graphql-woocommerce`
   to the `weave.php` plugin header (WP 6.5+ plugin-dependency API) and document a minimum WPGraphQL version
   at or past the CVE-2026-33290 fix in the plugin readme.
4. **Pin Composer + extend Dependabot.** Replace `wordpress-stubs: "*"` with a concrete range (e.g.
   `"^6.5"` matching the `Requires at least: 6.4` floor); add a `composer` ecosystem entry to
   `dependabot.yml` for `/Weave/WordPress`.
5. **Pin CI-running root devDeps.** Exact-pin `@wordpress/env` and `dotenv-cli`; move `jsdom` into the pnpm
   catalog to enforce a single version across packages.

### Rejected alternatives

- **Keep the static `NPM_TOKEN` alongside OIDC** — a static publish token is a standing
  secret-compromise risk and provides no attestation. OIDC Trusted Publishing is token-free and
  cryptographically anchors provenance; there is no reason to keep both.
- **`--provenance` without OIDC Trusted Publishing** — works, but Trusted Publishing is the stronger,
  recommended model and removes the token entirely. Prefer it.
- **Floating action tags for convenience** — rejected; the convenience is exactly the attack surface.
  Dependabot already neutralizes the maintenance cost of SHA pins.
- **Bundling/vendoring WPGraphQL** — out of scope and against the WP plugin model; the merchant installs it.
  The correct lever is the `Requires Plugins` dependency declaration, not vendoring.

## Consequences

- **Release pipeline** changes are small and mechanical (one publish flag, token removal, SHA pins) but
  must be verified end-to-end on the next release: `npm audit signatures` should pass for a published
  `@arc/*` package.
- **Merchants** on a too-old WPGraphQL will be blocked by WP's plugin-dependency enforcement instead of
  silently running a vulnerable stack.
- **Dependabot PR volume** rises slightly (Composer + SHA-pinned actions); the existing grouped-dev-deps
  config keeps it manageable.
- No runtime code changes — this is entirely CI/config/manifest surface.

## Validation

- Next release: confirm `npm audit signatures` passes and the npm package page shows a provenance badge.
- CI: confirm no workflow references a mutable action tag (a grep guard in `ci.yml` can enforce this).
- Plugin: confirm WP refuses to activate Weave when WPGraphQL is absent/below the declared minimum.

## References

- Audit: `Documentation/Architecture/AUDIT-hydrogen-weaverse-parity-2026-06-08.html` (Supply-chain S-1/S-2/S-3)
- CVE-2026-33290 (WPGraphQL): https://freshysites.com/resources/wordpress-security-bulletin-wpgraphql-vulnerability-cve-2026-33290/
- ADR-0001 (versioning policy), ADR-0008 (npm scope) — release governance this extends
