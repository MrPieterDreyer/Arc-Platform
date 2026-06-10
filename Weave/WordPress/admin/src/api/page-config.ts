/**
 * page-config REST client (WEAVE-WP-07, D-08) — the @wordpress/api-fetch surface for the
 * weave/v1 page-config routes the 4a `Weave_REST_Controller` exposes.
 *
 * `@wordpress/api-fetch` auto-injects the `X-WP-Nonce` header for same-origin WP REST requests,
 * so this module never touches auth (D-08). The slug is URL-encoded into the route path.
 *
 *   - loadPage(slug) → GET  /weave/v1/pages/{slug}      (the full ADR-0005 config)
 *   - savePage(slug, config) → PUT /weave/v1/pages/{slug} (server stamps updatedAt + fires the
 *     4a save_post webhook → the Plan-04 revalidate handler — closing the WEAVE-NEXT-04 loop)
 */

import type { WeavePageConfig } from '@weave-platform/react';
import apiFetch from '@wordpress/api-fetch';

/** The weave/v1 REST path for one page slug (URL-encoded). */
function pagePath(slug: string): string {
  return `/weave/v1/pages/${encodeURIComponent(slug)}`;
}

/** GET the stored page config for `slug`. Rejects (api-fetch throws) on a non-2xx response. */
export function loadPage(slug: string): Promise<WeavePageConfig> {
  return apiFetch({ path: pagePath(slug) });
}

/** PUT the assembled config for `slug`. Resolves with the server's response on success. */
export function savePage(slug: string, config: WeavePageConfig): Promise<unknown> {
  return apiFetch({ path: pagePath(slug), method: 'PUT', data: config });
}
