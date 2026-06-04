/**
 * WP Admin editor bootstrap (WEAVE-WP-07, OQ3) — the wp-scripts build entry.
 *
 * Resolves the target page slug from `?slug=`, defaulting to `home` (OQ3), creates a TanStack
 * `QueryClient`, and mounts `<Editor>` (wrapped in `QueryClientProvider`) into the
 * `#weave-editor-root` container the PHP admin screen prints. The root lookup is guarded so the
 * module is import-safe (no-op) when the container is absent — e.g. under the jsdom test harness.
 *
 * React comes from `@wordpress/element` (WP's de-duped React, externalized at build via the
 * generated asset manifest — OQ1) so no second React copy is bundled.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, createRoot } from '@wordpress/element';
import { Editor } from './editor/Editor';

/** Resolve the target slug from `?slug=`, defaulting to `home` (OQ3). A missing OR empty `?slug=`
 * both fall back to `home` — an empty slug is never a valid page target. */
export function resolveSlug(): string {
  const slug = new URLSearchParams(window.location.search).get('slug');
  return slug && slug.length > 0 ? slug : 'home';
}

/** Mount the editor into `#weave-editor-root` if present (no-op otherwise — import-safe). */
export function mountEditor(): void {
  const container = document.getElementById('weave-editor-root');
  if (!container) {
    return;
  }
  const queryClient = new QueryClient();
  const root = createRoot(container);
  root.render(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(Editor, { slug: resolveSlug() }),
    ),
  );
}

mountEditor();
