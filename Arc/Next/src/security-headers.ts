// ADR-0010 — security headers + Content-Security-Policy as a first-class @arc-platform/next
// concern (parity audit finding H-1). Pure module: no next/* imports, safe in the
// RSC barrel. The per-request nonce accessor lives in ./nonce.ts (server-only).

/** Request/response header used by `proxy.ts` to thread the per-request CSP nonce to RSC. */
export const ARC_NONCE_HEADER = 'x-arc-nonce';

/** Enforcing CSP response header name. */
export const ARC_CSP_HEADER = 'Content-Security-Policy';

/**
 * Report-only CSP response header name. ADR-0010: templates START report-only and
 * switch to {@link ARC_CSP_HEADER} once the storefront has validated its origins.
 */
export const ARC_CSP_REPORT_ONLY_HEADER = 'Content-Security-Policy-Report-Only';

export interface ArcSecurityHeader {
  key: string;
  value: string;
}

/**
 * Static security header set (ADR-0010 §1) in the shape Next's `next.config.ts`
 * `async headers()` expects:
 *
 * ```ts
 * // next.config.ts
 * async headers() {
 *   return [{ source: '/(.*)', headers: arcSecurityHeaders() }];
 * }
 * ```
 *
 * The per-request CSP is NOT included here — mint it in `proxy.ts` via {@link createArcCsp}.
 */
export function arcSecurityHeaders(): ArcSecurityHeader[] {
  return [
    // 2 years, preload-eligible. HTTPS is already mandatory for the cart cookie (ADR-0006).
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    // Legacy fallback for the CSP frame-ancestors directive (older crawlers/proxies).
    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    // Conservative: storefronts need none of these sensors. `payment=(self)` keeps the
    // Payment Request API available to same-origin checkout (gateway iframes opt in
    // via createArcCsp frameSrc, not here).
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=(), payment=(self)',
    },
  ];
}

export interface ArcCspOptions {
  /** Per-request nonce minted in `proxy.ts` (base64, ≥128-bit). */
  nonce: string;
  /**
   * Origins the storefront talks to: the WC Store API origin, the WPGraphQL origin,
   * and any payment-gateway origins. REQUIRED — there is no safe default origin list
   * for an arbitrary WC backend (ADR-0010 Consequences).
   */
  connectSrc: string[];
  /** Extra script origins (analytics, gateway JS). `'self'` + nonce are always present. */
  scriptSrc?: string[];
  /** Extra style origins. `'self' 'unsafe-inline'` is the baseline (Next inline styles). */
  styleSrc?: string[];
  /** Extra image origins (the WP media origin, CDN). `'self' data: blob:` is the baseline. */
  imgSrc?: string[];
  /** Extra font origins. `'self'` is the baseline. */
  fontSrc?: string[];
  /** Frame embeds (3DS / gateway iframes). `'self'` is the baseline. */
  frameSrc?: string[];
  /** Form posts (WC-hosted checkout handoff). `'self'` is the baseline. */
  formAction?: string[];
  /** `report-uri`/`report-to` endpoint for violation reports. */
  reportUri?: string;
}

function directive(name: string, values: string[]): string {
  return `${name} ${values.join(' ')}`;
}

/**
 * Builds the Arc CSP string (ADR-0010 §1). Locked directives: `default-src 'self'`,
 * `frame-ancestors 'none'`, `base-uri 'self'`, `object-src 'none'`, and a per-request
 * script nonce. Everything origin-shaped is pinned by the consumer.
 *
 * Set it report-only first:
 * ```ts
 * response.headers.set(ARC_CSP_REPORT_ONLY_HEADER, createArcCsp({ nonce, connectSrc: [wp] }));
 * ```
 */
export function createArcCsp(options: ArcCspOptions): string {
  const {
    nonce,
    connectSrc,
    scriptSrc = [],
    styleSrc = [],
    imgSrc = [],
    fontSrc = [],
    frameSrc = [],
    formAction = [],
    reportUri,
  } = options;

  if (!nonce || nonce.length < 16) {
    throw new Error('createArcCsp: nonce must be a ≥16-char per-request value (ADR-0010)');
  }
  if (connectSrc.length === 0) {
    throw new Error(
      'createArcCsp: connectSrc is required — pin the WC Store API, WPGraphQL, and gateway origins (ADR-0010)',
    );
  }

  const directives = [
    directive('default-src', ["'self'"]),
    directive('script-src', ["'self'", `'nonce-${nonce}'`, ...scriptSrc]),
    directive('style-src', ["'self'", "'unsafe-inline'", ...styleSrc]),
    directive('img-src', ["'self'", 'data:', 'blob:', ...imgSrc]),
    directive('font-src', ["'self'", ...fontSrc]),
    directive('connect-src', ["'self'", ...connectSrc]),
    directive('frame-src', ["'self'", ...frameSrc]),
    directive('form-action', ["'self'", ...formAction]),
    directive('frame-ancestors', ["'none'"]),
    directive('base-uri', ["'self'"]),
    directive('object-src', ["'none'"]),
  ];
  if (reportUri) directives.push(directive('report-uri', [reportUri]));

  return directives.join('; ');
}
