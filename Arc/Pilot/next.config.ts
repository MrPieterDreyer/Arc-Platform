import { arcSecurityHeaders } from '@arc-platform/next';
import type { NextConfig } from 'next';

const nextConfig = {
  cacheComponents: true,
  // ADR-0010: static security headers (HSTS, nosniff, Referrer-Policy, X-Frame-Options,
  // Permissions-Policy). The per-request nonce CSP is minted in proxy.ts.
  async headers() {
    return [{ source: '/(.*)', headers: arcSecurityHeaders() }];
  },
} satisfies NextConfig;

export default nextConfig;
