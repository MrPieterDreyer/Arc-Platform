---
"@arc-platform/core": patch
"@arc-platform/next": patch
"@weave-platform/react": patch
"@weave-platform/next": patch
---

Publish with npm provenance attestations via `publishConfig.provenance` (ADR-0012 S-1). The 0.1.0 tarballs shipped without attestations because the `NPM_CONFIG_PROVENANCE` environment variable is not honored when changesets publishes through pnpm; `publishConfig` is the package-manager-agnostic mechanism. No runtime changes.
