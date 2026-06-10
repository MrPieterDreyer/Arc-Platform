import { arcTsup } from '../../tsup.base';

// Two entries: the RSC-safe main barrel and the client-only hooks barrel.
// The hooks barrel imports `client-only`, so importing `@arc-platform/core` server-side
// never pulls React client hooks into a Server Component, and importing the
// hooks barrel server-side fails loudly. tsup auto-externalizes `client-only`
// (it's a runtime dependency), so the guard import is preserved in the output.
export default arcTsup({
  entry: { index: 'src/index.ts', hooks: 'src/hooks/index.ts' },
});
