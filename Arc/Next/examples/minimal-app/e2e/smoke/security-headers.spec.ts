import { expect, test } from '../fixtures/backend';

// ADR-0010 Validation: the storefront response carries the static security headers
// (next.config.ts headers()) and the report-only nonce CSP (proxy.ts).
test.describe('ADR-0010 — security headers', () => {
  test('home response carries static security headers @smoke', async ({ page }) => {
    const res = await page.goto('/');
    expect(res?.ok()).toBeTruthy();

    const headers = res?.headers() ?? {};
    expect(headers['strict-transport-security']).toContain('max-age=63072000');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(headers['permissions-policy']).toContain('camera=()');
  });

  test('home response carries the report-only nonce CSP from proxy.ts @smoke', async ({ page }) => {
    const res = await page.goto('/');
    expect(res?.ok()).toBeTruthy();

    const csp = res?.headers()['content-security-policy-report-only'];
    expect(csp).toBeTruthy();
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toMatch(/'nonce-[A-Za-z0-9+/=]{16,}'/);
  });
});
