# ADR-0006: Cart-Token Cookie Name + Scope

**Status:** Accepted
**Date:** 2026-05-28
**Deciders:** Arc Platform maintainers
**Phase:** Phase 0
**Related requirements:** TOOL-09 (prep for ARC-API-01, ARC-NEXT-02)

## Context

The WC Store API v1 uses a Cart-Token as the session identifier for anonymous shoppers in a headless (cookie-less) deployment. Per PITFALLS P1, this token is the ONLY persistent handle that ties a visitor's in-memory cart on the WP server to subsequent requests from the Next.js frontend. If the token is lost between page navigations, the shopper's cart is silently orphaned.

The token must:
1. Persist across page reloads and tab switches
2. Not be accessible to JavaScript (to prevent XSS exfiltration)
3. Work in cross-origin deployments where the Next.js origin (`shop.example.com`) differs from the WP origin (`cms.example.com`)
4. Survive Safari's Intelligent Tracking Prevention (ITP) and Firefox's Total Cookie Protection

Per the WooCommerce developer docs: "When using a Cart-Token a Nonce Token is not required." This simplifies the auth model — Arc does not need to manage WP nonces for cart operations.

## Decision Drivers

- Cross-origin support: Next origin ≠ WP origin is a first-class deployment pattern for Arc
- Security: HttpOnly eliminates XSS exfiltration; no JavaScript should ever read this cookie
- ITP/TCP survival: `SameSite=None; Secure` is the only combination that works cross-origin; `SameSite=Lax` or `SameSite=Strict` breaks cross-origin cart writes
- Consistency: cookie name must be a stable constant — both `@arc/core` (WooClient) and `@arc/next` (cookie bridge) reference it
- Multi-tab: cookie is shared across tabs by the browser automatically (unlike localStorage or sessionStorage which can be tab-isolated in some modes)

## Considered Options

1. **localStorage** — JavaScript-only; no XSS protection; not shared across tabs in all browsers; not readable by Server Components; breaks with private browsing and some iOS browsers
2. **`arc_cart_token` HttpOnly cookie on the Next.js origin (chosen)** — server-set; HttpOnly; cross-origin safe with `SameSite=None; Secure`; readable by Next.js Server Components via `cookies()` API; shared across tabs
3. **URL search parameter** — token visible in URLs, browser history, server logs; must be propagated manually on every navigation; breaks bookmarks and link sharing

## Decision

The WC Store API Cart-Token is persisted as an HttpOnly cookie named **`arc_cart_token`** set on the Next.js origin by `@arc/next` Server Actions or route handlers.

**Cookie specification:**

| Attribute | Value | Rationale |
|-----------|-------|-----------|
| Name | `arc_cart_token` | Stable, namespaced, human-readable |
| `HttpOnly` | true | Prevents JavaScript read; blocks XSS exfiltration |
| `SameSite` | `None` | Required for cross-origin deployment (Next origin ≠ WP origin) |
| `Secure` | true | Mandatory when `SameSite=None`; requires HTTPS everywhere including local dev |
| `Path` | `/` | Cookie sent on all paths; required because cart operations happen on any page |
| `Max-Age` | `2592000` (30 days) | Matches WC Store API token expiry; cookie refreshed (Max-Age reset) on each cart read |
| `Domain` | unset | Host-only binding — cookie scoped to the exact Next.js origin, not subdomains |

**Token lifecycle:**
1. On first cart interaction (GET `/wp-json/wc/store/v1/cart`), WC returns a `Cart-Token` response header
2. `WooClient` (Phase 1, `@arc/core`) extracts the token and calls a registered `onCartToken` callback
3. `@arc/next` (Phase 2) registers the callback; the callback sets the `arc_cart_token` cookie via Next.js `cookies().set()`
4. On subsequent cart requests, `@arc/next` reads the cookie via `cookies().get('arc_cart_token')` and injects it as a `Cart-Token` request header to WC
5. On each successful cart response, the cookie `Max-Age` is refreshed to reset the 30-day window

**Local development:** HTTPS is required because `SameSite=None` mandates `Secure`. Use `mkcert` to provision a local TLS certificate. The Pilot starter (Phase 5) documents this setup.

**Dev/test escape hatch (`ARC_CART_COOKIE_SECURE`, added 2026-06-09 — decision 1-F):** for plain-HTTP local E2E (`http://localhost`), setting `ARC_CART_COOKIE_SECURE=false` downgrades the cookie to `SameSite=Lax; Secure=false`. The override is **ignored when `NODE_ENV === 'production'`** — production always ships `SameSite=None; Secure` regardless of env (fail-closed rule, AGENTS.md Code conventions). `ARC_CART_COOKIE_SECURE=true` (or unset) is the default everywhere.

## Consequences

### Positive

- `HttpOnly` flag means no JavaScript (malicious or otherwise) can read the token — XSS attacks cannot exfiltrate the cart session
- `SameSite=None; Secure` enables cross-origin cookie sending — the canonical Arc deployment (Next.js on Vercel, WooCommerce on a separate host) works out of the box
- Cookie is shared across browser tabs automatically — multi-tab shopping cart is consistent without application-level synchronisation
- `Max-Age=2592000` gives a 30-day window with auto-refresh on activity — abandoned cart recovery tools can still work (token stays alive as long as there is activity)

### Negative

- `SameSite=None; Secure` mandates HTTPS in all environments including local development. Developers must run `mkcert` (or equivalent) — `http://localhost` will NOT work for cart operations. This is documented as a prerequisite in the Pilot starter README.
- Some cookie consent banners may flag `arc_cart_token` as requiring consent. It is a strictly-necessary cookie (required for core shopping functionality) and exempt under GDPR Article 5(3) strictly-necessary exception — but the merchant's legal team must confirm this classification in their jurisdiction.
- Generic cross-origin cookie pitfall: if the Next.js domain changes (e.g. custom domain launch), existing cookies on the old domain are abandoned — carts are lost. Document this in the deployment guide.

### Neutral

- Cookie name `arc_cart_token` is reserved — NEVER used for any other purpose in `@arc/*` or `@weave/*` packages
- The `Domain` attribute is intentionally unset (host-only) — the cookie does NOT propagate to subdomains; each subdomain deployment manages its own cookie

## Implementation Notes

- Phase 1 (`@arc/core`, `WooClient`): `WooClient` is framework-agnostic — it does not set cookies directly. It accepts an `onCartToken: (token: string) => void` constructor option and calls it when a new `Cart-Token` header is received. This keeps `@arc/core` free of Next.js or browser dependencies.
- Phase 2 (`@arc/next`): the cookie bridge registers `onCartToken` and uses the Next.js `cookies()` API:
  ```typescript
  cookies().set('arc_cart_token', token, {
    httpOnly: true,
    sameSite: 'none',
    secure: true,
    path: '/',
    maxAge: 2_592_000,
  });
  ```
- Phase 2 (`@arc/next`): cart request interceptor reads `cookies().get('arc_cart_token')?.value` and injects `'Cart-Token': token` into every WC Store API request header.
- Phase 5 (Pilot starter): `README.md` documents the `mkcert` setup for local HTTPS as a prerequisite for cart functionality.
- The cookie name constant `ARC_CART_TOKEN_COOKIE = 'arc_cart_token'` is exported from `@arc/next` as a named constant — both the bridge and any consumer code use the constant, never a string literal.

## References

- Research: `.planning/research/PITFALLS.md` P1 — Cart-Token / Nonce confusion in headless WC
- [WooCommerce Store API — Cart Tokens](https://developer.woocommerce.com/docs/apis/store-api/cart-tokens/)
- [WooCommerce Store API — Nonce Tokens](https://developer.woocommerce.com/docs/apis/store-api/nonce-tokens/) — confirmed: Cart-Token replaces nonce for headless
- [MDN — SameSite cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)
- [mkcert — locally trusted development certificates](https://github.com/FiloSottile/mkcert)
