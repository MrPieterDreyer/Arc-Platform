# @weave-platform/next

## 0.1.1

### Patch Changes

- [#32](https://github.com/MrPieterDreyer/Arc-Platform/pull/32) [`ac2203f`](https://github.com/MrPieterDreyer/Arc-Platform/commit/ac2203f60c0db5cea55c8a7f38e0be5aff67d8ea) Thanks [@MrPieterDreyer](https://github.com/MrPieterDreyer)! - Publish with npm provenance attestations via `publishConfig.provenance` (ADR-0012 S-1). The 0.1.0 tarballs shipped without attestations because the `NPM_CONFIG_PROVENANCE` environment variable is not honored when changesets publishes through pnpm; `publishConfig` is the package-manager-agnostic mechanism. No runtime changes.

- Updated dependencies [[`ac2203f`](https://github.com/MrPieterDreyer/Arc-Platform/commit/ac2203f60c0db5cea55c8a7f38e0be5aff67d8ea)]:
  - @arc-platform/next@0.1.1
  - @weave-platform/react@0.1.1

## 0.1.0

### Minor Changes

- [#12](https://github.com/MrPieterDreyer/Arc-Platform/pull/12) [`1aa3862`](https://github.com/MrPieterDreyer/Arc-Platform/commit/1aa3862a37bdc2f54056d41040fd4632f4bc8dc4) Thanks [@MrPieterDreyer](https://github.com/MrPieterDreyer)! - Add `@weave-platform/react/schemas` RSC-safe page-config exports. Add `@weave-platform/next` cached `loadPageConfig`, `weaveTag` helpers, and `@weave-platform/next/server` (loader-only) plus `@weave-platform/next/server-page` (`<WeavePage />`) entries.

### Patch Changes

- [`5adf8f2`](https://github.com/MrPieterDreyer/Arc-Platform/commit/5adf8f275d1fc68bd3d4255c3f19b21c4196213c) - Add MIT license and repository metadata to publishable packages.

- Updated dependencies [[`1aa3862`](https://github.com/MrPieterDreyer/Arc-Platform/commit/1aa3862a37bdc2f54056d41040fd4632f4bc8dc4), [`499936f`](https://github.com/MrPieterDreyer/Arc-Platform/commit/499936f0a1c7070c95c3ab07bd9ca544c97e7114), [`5adf8f2`](https://github.com/MrPieterDreyer/Arc-Platform/commit/5adf8f275d1fc68bd3d4255c3f19b21c4196213c), [`dae68ad`](https://github.com/MrPieterDreyer/Arc-Platform/commit/dae68ad8fc2a263bc6bb31cfe80368de012edffd), [`1aa3862`](https://github.com/MrPieterDreyer/Arc-Platform/commit/1aa3862a37bdc2f54056d41040fd4632f4bc8dc4)]:
  - @arc-platform/next@0.1.0
  - @weave-platform/react@0.1.0
