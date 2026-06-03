import 'server-only';

/**
 * `@weave/next/server` — the server-only barrel (Pitfall 5).
 *
 * Every module re-exported here pulls `import 'server-only'`, so consumers reach these APIs ONLY
 * via the `./server` subpath. The RSC-safe main barrel (`./index`) must never re-export from here,
 * or a client graph could transitively import `server-only` and fail the build.
 *
 * Mirrors `@arc/next`'s `src/server.ts` split.
 */

export { weaveTag } from './cache-tags.js';
export { loadPageConfig } from './load-page-config.js';
export { createPreviewHandler, type PreviewHandlerOptions } from './preview.js';
export { createWeaveRevalidateHandler } from './revalidate.js';

// WeavePage (SectionRenderer + loadPageConfig) is not exported here — it pulls
// @weave/react into the server barrel graph. Import from ./weave-page.js in
// client-wrapped storefront routes, or use loadPageConfig + a client SectionRenderer.
