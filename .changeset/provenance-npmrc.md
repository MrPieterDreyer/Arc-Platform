---
"@arc-platform/core": patch
"@arc-platform/next": patch
"@weave-platform/react": patch
"@weave-platform/next": patch
---

Enable Sigstore provenance attestations via the repo-root `.npmrc` `provenance=true` rc option — the mechanism `pnpm publish` actually reads (ADR-0012 S-1). The 0.1.0/0.1.1 tarballs shipped unattested because `publishConfig.provenance` and the `NPM_CONFIG_PROVENANCE` env var are npm-CLI mechanisms that pnpm, which changesets publishes through, ignores. No runtime changes.
