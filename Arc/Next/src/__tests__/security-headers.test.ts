import { describe, expect, it } from 'vitest';
import {
  ARC_CSP_HEADER,
  ARC_CSP_REPORT_ONLY_HEADER,
  ARC_NONCE_HEADER,
  arcSecurityHeaders,
  createArcCsp,
} from '../security-headers.js';

const NONCE = 'dGVzdC1ub25jZS0xMjM0NTY=';

describe('ADR-0010 — arcSecurityHeaders (static set)', () => {
  it('emits HSTS, nosniff, Referrer-Policy, X-Frame-Options, Permissions-Policy', () => {
    const headers = arcSecurityHeaders();
    const byKey = Object.fromEntries(headers.map((h) => [h.key, h.value]));

    expect(byKey['Strict-Transport-Security']).toBe('max-age=63072000; includeSubDomains');
    expect(byKey['X-Content-Type-Options']).toBe('nosniff');
    expect(byKey['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(byKey['X-Frame-Options']).toBe('SAMEORIGIN');
    expect(byKey['Permissions-Policy']).toContain('camera=()');
  });

  it('does NOT include a CSP — that is per-request, minted in proxy.ts', () => {
    const keys = arcSecurityHeaders().map((h) => h.key);
    expect(keys).not.toContain(ARC_CSP_HEADER);
    expect(keys).not.toContain(ARC_CSP_REPORT_ONLY_HEADER);
  });
});

describe('ADR-0010 — createArcCsp', () => {
  it('emits the locked directives + per-request nonce (ADR-0010 Validation)', () => {
    const csp = createArcCsp({ nonce: NONCE, connectSrc: ['https://wp.example'] });

    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain(`'nonce-${NONCE}'`);
    expect(csp).toContain("default-src 'self'");
  });

  it('pins connectSrc entries verbatim', () => {
    const csp = createArcCsp({
      nonce: NONCE,
      connectSrc: ['https://wp.example', 'https://gateway.example'],
    });

    const connect = csp.split('; ').find((d) => d.startsWith('connect-src'));
    expect(connect).toBe("connect-src 'self' https://wp.example https://gateway.example");
  });

  it('appends consumer scriptSrc/frameSrc/formAction extras after the baseline', () => {
    const csp = createArcCsp({
      nonce: NONCE,
      connectSrc: ['https://wp.example'],
      scriptSrc: ['https://js.stripe.example'],
      frameSrc: ['https://3ds.stripe.example'],
      formAction: ['https://wp.example'],
    });

    expect(csp).toContain("script-src 'self' " + `'nonce-${NONCE}' https://js.stripe.example`);
    expect(csp).toContain("frame-src 'self' https://3ds.stripe.example");
    expect(csp).toContain("form-action 'self' https://wp.example");
  });

  it('appends report-uri when provided', () => {
    const csp = createArcCsp({
      nonce: NONCE,
      connectSrc: ['https://wp.example'],
      reportUri: 'https://report.example/csp',
    });
    expect(csp).toContain('report-uri https://report.example/csp');
  });

  it('rejects a missing/short nonce — no nonce-less CSP ships (fail closed)', () => {
    expect(() => createArcCsp({ nonce: '', connectSrc: ['https://wp.example'] })).toThrow(/nonce/);
    expect(() => createArcCsp({ nonce: 'short', connectSrc: ['https://wp.example'] })).toThrow(
      /nonce/,
    );
  });

  it('rejects empty connectSrc — origin pinning is required, not defaulted', () => {
    expect(() => createArcCsp({ nonce: NONCE, connectSrc: [] })).toThrow(/connectSrc/);
  });
});

describe('ADR-0010 — header name constants', () => {
  it('exposes the nonce passthrough + both CSP header names', () => {
    expect(ARC_NONCE_HEADER).toBe('x-arc-nonce');
    expect(ARC_CSP_HEADER).toBe('Content-Security-Policy');
    expect(ARC_CSP_REPORT_ONLY_HEADER).toBe('Content-Security-Policy-Report-Only');
  });
});
