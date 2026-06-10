---
"@arc/core": minor
"@arc/next": minor
---

Wave-1 security hardening from the Hydrogen/Weaverse parity audit:

- **Customer auth (ADR-0009, audit H-2)** — `@arc/core` gains `loginCustomer()` and `refreshAuthToken()` WPGraphQL JWT mutations; `@arc/next` gains an HttpOnly cookie bridge (`arc_auth_token` 15 min / `arc_refresh_token` 14 days, ADR-0006 attributes) plus server helpers `loginAction`, `logoutAction`, `getAuthToken`, `isAuthenticated`, and `loadCustomerOrders`. Raw JWT env-token auth in the example app is now gated behind `ARC_E2E_ALLOW_TOKEN_AUTH=true`.
- **Security headers + CSP (ADR-0010, audit H-1)** — new `arcSecurityHeaders()` static header set and `createArcCsp()` nonce-based CSP builder exported from `@arc/next`, with `useArcNonce()` for server components and a Next 16 `proxy.ts` reference implementation in the minimal-app example (report-only first).
- **Catalog cache guard (audit CACHE-P1)** — `loadProduct`/`loadCollection` no longer cache null lookups: a sentinel error is thrown inside the `'use cache'` scope (errors are never cached) and translated back to `null` at the loader boundary.
- **Cookie Secure override fail-closed (HANDOFF 1-F)** — `ARC_CART_COOKIE_SECURE=false` is ignored when `NODE_ENV === 'production'`.
