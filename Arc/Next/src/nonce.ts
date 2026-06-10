import 'server-only';

import { headers } from 'next/headers';
import { ARC_NONCE_HEADER } from './security-headers.js';

/**
 * RSC-readable accessor for the per-request CSP nonce minted in `proxy.ts`
 * (ADR-0010 §1). Returns null when no proxy set the header — e.g. during
 * static generation, where a nonce CSP does not apply.
 *
 * ```tsx
 * const nonce = await useArcNonce();
 * return <Script nonce={nonce ?? undefined} … />;
 * ```
 */
export async function useArcNonce(): Promise<string | null> {
  const requestHeaders = await headers();
  return requestHeaders.get(ARC_NONCE_HEADER);
}
