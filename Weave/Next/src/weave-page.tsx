import 'server-only';

import { SectionRenderer } from '@weave-platform/react';
import { loadPageConfig } from './load-page-config.js';

/**
 * `<WeavePage slug>` — the storefront entry point (WEAVE-NEXT-02, RESEARCH §Pattern 3).
 *
 * An async Server Component that turns a slug into rendered sections: it awaits the server-only
 * `loadPageConfig(slug)` (cached + draft-aware, Plan 02) and delegates to `@weave-platform/react`'s
 * `<SectionRenderer>`, which renders the config's sections in array order and NEVER throws
 * (Phase 3 page-level resilience guarantee).
 *
 * Server-only (Pitfall 5): this module awaits a server-only loader and must never reach a client
 * graph — it is reached via the `@weave-platform/next/server` barrel, not the RSC-safe main barrel.
 */
export async function WeavePage({ slug }: { slug: string }) {
  const config = await loadPageConfig(slug);
  return <SectionRenderer config={config} />;
}
