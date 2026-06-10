import 'server-only';

/**
 * `@weave-platform/next/server` — the server-only barrel (Pitfall 5).
 *
 * Every module re-exported here pulls `import 'server-only'`, so consumers reach these APIs ONLY
 * via the `./server` subpath. The RSC-safe main barrel (`./index`) must never re-export from here,
 * or a client graph could transitively import `server-only` and fail the build.
 *
 * Mirrors `@arc-platform/next`'s `src/server.ts` split.
 */

export { weaveTag } from './cache-tags.js';
export { loadPageConfig } from './load-page-config.js';
export { createPreviewHandler, type PreviewHandlerOptions } from './preview.js';
export { createWeaveRevalidateHandler } from './revalidate.js';

// WeavePage is deliberately NOT re-exported here. It imports the `@weave-platform/react` package barrel,
// which carries `import 'client-only'`; re-exporting it from this server-only entry would drag
// `client-only` into the RSC graph of any consumer that imports `@weave-platform/next/server` from a Server
// Component, breaking their build ("'client-only' cannot be imported from a Server Component
// module" — verified against examples/minimal-app). The supported pattern is `loadPageConfig` in
// the Server Component + a Client Component that calls `<SectionRenderer>` (see
// examples/minimal-app/components/weave-page-sections.tsx). Import `./weave-page.js` directly only
// from an explicitly client-wrapped route.
