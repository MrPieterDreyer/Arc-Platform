import 'server-only';

// next@16.2.x — stable cache APIs only (FORBIDDEN: unstable_cache, per D-04 / Pitfall 2).
import { ARC_CACHE_PROFILE } from '@arc-platform/next';
import { type WeavePageConfig, WeavePageConfigSchema } from '@weave-platform/react/schemas';
import { cacheLife, cacheTag } from 'next/cache';
import { draftMode } from 'next/headers';
import { weaveTag } from './cache-tags.js';

/**
 * `loadPageConfig(slug)` — server-only, draft-aware page-config loader (WEAVE-NEXT-01, D-04/D-04a/D-06).
 *
 * Non-draft reads are cached under `weave:page:{slug}` via Next 16 `'use cache'` + `cacheTag`.
 * Draft-mode reads bypass the cache (`cache: 'no-store'`) and are NOT tagged. Every response is
 * validated with `WeavePageConfigSchema.parse()` — a parse failure or non-ok HTTP throws, because
 * the 4a PHP validator was built to schema parity, so a reject is a real contract break.
 *
 * Auth is a WP Application Password sent as HTTP Basic. Credentials come from the environment:
 * `WEAVE_WP_BASE_URL`, `WEAVE_WP_APP_USER`, `WEAVE_WP_APP_PASSWORD` (see `.env.example`, D-04a).
 */

interface WpAuthEnv {
  baseUrl: string;
  user: string;
  password: string;
}

/** Read the three WP env vars; throw before any fetch if any is missing (Pitfall 6). */
function readEnv(): WpAuthEnv {
  const baseUrl = process.env.WEAVE_WP_BASE_URL;
  const user = process.env.WEAVE_WP_APP_USER;
  const password = process.env.WEAVE_WP_APP_PASSWORD;
  if (!baseUrl || !user || !password) {
    throw new Error(
      'Missing WEAVE_WP_* env (WEAVE_WP_BASE_URL / WEAVE_WP_APP_USER / WEAVE_WP_APP_PASSWORD)',
    );
  }
  return { baseUrl, user, password };
}

/** WP Application Passwords contain spaces — stored verbatim, base64-encoded as-is (Pitfall 6). */
function authHeader(env: WpAuthEnv): string {
  return `Basic ${Buffer.from(`${env.user}:${env.password}`).toString('base64')}`;
}

/**
 * Single fetch + validate path. `noStore` is the ONLY cache control and is set on the
 * draft/bypass path only — never inside the `'use cache'` scope (Pitfall 2).
 */
async function fetchConfig(slug: string, noStore: boolean): Promise<WeavePageConfig> {
  const env = readEnv();
  const res = await fetch(`${env.baseUrl}/wp-json/weave/v1/pages/${encodeURIComponent(slug)}`, {
    headers: { Authorization: authHeader(env), Accept: 'application/json' },
    ...(noStore ? { cache: 'no-store' } : {}),
  });
  if (!res.ok) {
    throw new Error(`loadPageConfig ${slug}: HTTP ${res.status}`);
  }
  return WeavePageConfigSchema.parse(await res.json());
}

/** The sole `'use cache'` scope — tags the read with `weave:page:{slug}` (D-04). */
async function cachedConfig(slug: string): Promise<WeavePageConfig> {
  'use cache';
  cacheTag(weaveTag.page(slug));
  cacheLife(ARC_CACHE_PROFILE.pageConfig);
  return fetchConfig(slug, false);
}

/**
 * Fetch the page config for `slug`. Draft mode bypasses the cache; otherwise the read is cached
 * under `weave:page:{slug}`. Throws on missing env, non-ok HTTP, or schema-parse failure.
 */
export async function loadPageConfig(slug: string): Promise<WeavePageConfig> {
  const { isEnabled } = await draftMode(); // Next 16: draftMode() MUST be awaited (Pitfall 1).
  if (isEnabled) {
    return fetchConfig(slug, true); // cache-bypassed (D-06)
  }
  return cachedConfig(slug);
}
