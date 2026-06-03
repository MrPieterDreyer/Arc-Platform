import 'server-only';

// next@16.2.x — draftMode() is async and bypasses 'use cache' (D-05/D-06, Pitfall 1).
import { timingSafeEqual } from 'node:crypto';
import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * `createPreviewHandler({ secret })` — draft-mode preview route factory (WEAVE-NEXT-03, D-05/D-06).
 *
 * Returns a Route Handler `GET(req)` that:
 *   1. Reads `?token=` and `?slug=` from the request URL.
 *   2. Compares the token to `secret` with a length-checked, constant-time `timingSafeEqual`
 *      (the length guard avoids `timingSafeEqual`'s throw-on-unequal-length and is itself the
 *      first comparison branch). A mismatch returns `401 { error: 'Invalid preview token' }`.
 *   3. On a match, enables draft mode — `(await draftMode()).enable()` (Next 16: draftMode() is
 *      async) — so subsequent `loadPageConfig` reads bypass `'use cache'` (D-06).
 *   4. `redirect('/{slug}')` to the previewed page. `redirect()` works by THROWING `NEXT_REDIRECT`,
 *      so it MUST stay outside any try/catch (Pitfall 7).
 *
 * Server-only (Pitfall 5): the secret + draft-mode toggle never reach a client graph.
 */

/** Length-checked constant-time string compare (avoids timingSafeEqual's throw on unequal length). */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export interface PreviewHandlerOptions {
  /** The shared preview secret (e.g. `process.env.WEAVE_PREVIEW_SECRET`). */
  secret: string;
}

/** Build a GET Route Handler that gates draft mode behind a timing-safe token check. */
export function createPreviewHandler({ secret }: PreviewHandlerOptions) {
  return async function GET(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const token = url.searchParams.get('token') ?? '';
    const slug = url.searchParams.get('slug') ?? '';

    if (!safeEqual(token, secret)) {
      return Response.json({ error: 'Invalid preview token' }, { status: 401 });
    }

    (await draftMode()).enable();
    redirect(`/${slug}`); // throws NEXT_REDIRECT — expected; do NOT catch (Pitfall 7).
  };
}
