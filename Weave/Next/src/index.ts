/**
 * `@weave-platform/next` — RSC-safe main barrel (Pitfall 5).
 *
 * Exports ONLY pure values + types. Nothing here imports a server-restricted module, so this entry
 * is safe inside a Client Component graph. The cached loader, page component, and draft-mode
 * factory (plus the forthcoming revalidate handler) live behind the `@weave-platform/next/server` subpath.
 */

export { weaveTag } from './cache-tags.js';
export type { WeavePageConfig, WeaveSection } from '@weave-platform/react';
