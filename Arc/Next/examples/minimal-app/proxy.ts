// Next 16 proxy (replaces middleware.ts) — mints the per-request CSP nonce and sets
// the Arc CSP header per ADR-0010. Starts REPORT-ONLY: flip to ARC_CSP_HEADER once
// the storefront's third-party origins are validated.
import {
  ARC_CSP_REPORT_ONLY_HEADER,
  ARC_NONCE_HEADER,
  createArcCsp,
} from '@arc/next';
import { type NextRequest, NextResponse } from 'next/server';

/** 128-bit random nonce, base64 — Web Crypto so it runs on the edge runtime too. */
function mintNonce(): string {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

/** WC + WPGraphQL origins for connect-src, derived from the same env the loaders use. */
function backendOrigins(): string[] {
  const origins = new Set<string>();
  for (const url of [process.env.ARC_WC_URL, process.env.ARC_GRAPHQL_ENDPOINT]) {
    if (!url) continue;
    try {
      origins.add(new URL(url).origin);
    } catch {
      // Malformed env URL — loaders will surface the real error; CSP just omits it.
    }
  }
  return [...origins];
}

export function proxy(request: NextRequest): NextResponse {
  const nonce = mintNonce();

  // Thread the nonce to the render tree (read via useArcNonce()).
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(ARC_NONCE_HEADER, nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  const origins = backendOrigins();
  response.headers.set(
    ARC_CSP_REPORT_ONLY_HEADER,
    createArcCsp({
      nonce,
      connectSrc: origins.length > 0 ? origins : ["'self'"],
      imgSrc: origins,
    }),
  );
  response.headers.set(ARC_NONCE_HEADER, nonce);
  return response;
}

export const config = {
  // Skip static assets — the nonce CSP only matters on rendered documents/APIs.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
