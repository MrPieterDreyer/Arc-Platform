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
export { WeavePage } from './weave-page.js';
export { createPreviewHandler, type PreviewHandlerOptions } from './preview.js';
export { createWeaveRevalidateHandler } from './revalidate.js';

// WeavePage is an async Server Component (it awaits the `server-only` loadPageConfig), so the
// `./server` subpath is its correct home. It pulls `@weave/react` + `react/jsx-runtime` into the
// server graph, but both are externalized by the build (see Scripts/verify-weave-next-externals.cjs),
// so no second React is bundled. The RSC-safe `./index` barrel still must not re-export it.
