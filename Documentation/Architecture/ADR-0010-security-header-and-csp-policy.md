# ADR-0010 — Security-Header & Content-Security-Policy Policy

**Status:** Accepted (2026-06-09; proposed 2026-06-08 — surfaced by Hydrogen/Weaverse parity audit)
**Date:** 2026-06-08
**Deciders:** Pieter Dreyer

## Context

The parity audit (`AUDIT-hydrogen-weaverse-parity-2026-06-08.html`, finding **H-1**) found that
Arc/Weave ships **no Content-Security-Policy and no security headers** anywhere. The example app's
`next.config.ts` sets only `cacheComponents` (`Arc/Next/examples/minimal-app/next.config.ts:3-5`);
there is no `proxy.ts`/`middleware.ts` and no `async headers()` block in any app.

Shopify Hydrogen ships this as a first-class framework concern:
- `createContentSecurityPolicy()` builds a full CSP with a per-request nonce, `frameAncestors 'none'`,
  `baseUri 'self'`, and pinned `connectSrc`/`styleSrc`
  (`references/hydrogen/packages/hydrogen/src/csp/csp.ts:70-168`).
- `useNonce()` + a `<Script>` wrapper inject the nonce into inline scripts (`csp/nonce.ts:1-17`).

For a framework that **renders merchant-authored page-config** (Weave sections) and **handles cart
state**, the absence of CSP, `X-Frame-Options`/`frame-ancestors` (clickjacking), `X-Content-Type-Options:
nosniff`, HSTS, `Referrer-Policy`, and `Permissions-Policy` is the single largest enterprise-parity gap.

Two Next.js 16 facts shape the decision:
- `middleware.ts` is deprecated → renamed `proxy.ts` with a named `proxy` export. A per-request nonce
  must be minted there and threaded into the CSP header + the render tree.
- Static headers (HSTS, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`) can be set
  declaratively via `next.config.ts` `async headers()` without per-request logic.

## Decision

**Proposed:** Ship security headers as a first-class `@arc-platform/next` concern, split by whether a value is
per-request (nonce CSP) or static.

1. **New module `@arc-platform/next/src/security-headers.ts`** exporting:
   - `arcSecurityHeaders()` — the static header set (HSTS, `X-Content-Type-Options: nosniff`,
     `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: SAMEORIGIN`,
     a conservative `Permissions-Policy`), returned in the shape Next's `headers()` expects.
   - `createArcCsp({ nonce, connectSrc, styleSrc, scriptSrc })` — builds a CSP string with
     `default-src 'self'`, `frame-ancestors 'none'`, `base-uri 'self'`, `object-src 'none'`, and a
     per-request `'nonce-…'` for scripts. `connectSrc` **must** be pinnable so the consumer can allow the
     WC Store API origin, the WPGraphQL origin, and the WC-hosted checkout/payment-gateway origins.
   - `useArcNonce()` — RSC-readable accessor for the nonce set by `proxy.ts` (header passthrough).

2. **Pilot starter ships a `proxy.ts`** that mints a per-request nonce, sets the CSP response header via
   `createArcCsp`, and forwards the nonce to the render tree (request header + `useArcNonce()`).

3. **The example app and Pilot set the static headers** via `next.config.ts` `async headers()` using
   `arcSecurityHeaders()`.

4. **CSP starts in report-only** (`Content-Security-Policy-Report-Only`) in templates, with a documented
   switch to enforcing once a storefront has validated its third-party origins.

### Rejected alternatives

- **Headers only in `next.config.ts`, no nonce CSP** — static headers are easy but a nonce-less CSP either
  forbids all inline scripts (breaks Next's hydration inline bootstrap) or falls back to
  `'unsafe-inline'` (defeats the purpose). A per-request nonce in `proxy.ts` is the correct Next 16 model.
- **Leave CSP to each consumer app** — rejected for the same reason Hydrogen ships it: every headless
  storefront needs it, the WC/WPGraphQL/checkout origin pinning is non-obvious, and "secure by default"
  is a framework responsibility, not a per-merchant rediscovery.
- **A library dependency (e.g. helmet)** — unnecessary weight; the header set is ~80 LOC and Next's
  `headers()` + `proxy.ts` are the native surface.

## Consequences

- **`@arc-platform/next`** gains `src/security-headers.ts` and a documented `proxy.ts` template. `connectSrc` is a
  required input — there is no safe default origin list for an arbitrary WC backend.
- **CSP interacts with Weave section rendering.** `SectionRenderer` already never
  `dangerouslySetInnerHTML`s config data (`Weave/React/src/render/SectionRenderer.tsx:96-105`), so a strict
  CSP is compatible; section authors that embed third-party scripts must extend `scriptSrc`/`connectSrc`.
  `references/WEAVE-SECTIONS.md` gains a rule: sections never inline-script without a nonce.
- **Checkout handoff** (`Arc/Core/src/store-api/checkout.ts`) requires the WC checkout + gateway origins in
  `connectSrc`/`form-action`; this ADR makes that pinning explicit rather than implicit.
- **Report-only default** avoids breaking storefronts on first deploy while still surfacing violations.

## Validation

- A Vitest test asserts `createArcCsp` emits `frame-ancestors 'none'`, `base-uri 'self'`,
  `object-src 'none'`, and a `nonce-` token, and that `connectSrc` entries appear verbatim.
- A Playwright e2e in the example app asserts the response carries CSP + HSTS + `nosniff` +
  `X-Frame-Options` headers and that the page renders with the nonce applied.

## References

- Audit: `Documentation/Architecture/AUDIT-hydrogen-weaverse-parity-2026-06-08.html` (finding H-1, H-3)
- Hydrogen CSP: `references/hydrogen/packages/hydrogen/src/csp/csp.ts:70-168`, `csp/nonce.ts:1-17`
- ADR-0002 (Next.js 16 + Gutenberg independence) — establishes the Next 16 `proxy.ts` baseline
- ADR-0006 (Cart-Token cookie) — `SameSite=None` posture this CSP complements
