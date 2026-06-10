# @arc-platform/next

## 0.1.3

### Patch Changes

- [#36](https://github.com/MrPieterDreyer/Arc-Platform/pull/36) [`73bd5b7`](https://github.com/MrPieterDreyer/Arc-Platform/commit/73bd5b793d3b943295312ac8e2abd92ae60c0f01) Thanks [@MrPieterDreyer](https://github.com/MrPieterDreyer)! - Publish via npm OIDC Trusted Publishing (ADR-0012): the release workflow exchanges the GitHub Actions id-token for a short-lived publish token — no stored npm secret — and npm attaches Sigstore provenance attestations automatically. This is the first attested release; 0.1.0–0.1.2 shipped unattested because provenance flag plumbing does not survive the changesets→pnpm publish path. No runtime changes.

- Updated dependencies [[`73bd5b7`](https://github.com/MrPieterDreyer/Arc-Platform/commit/73bd5b793d3b943295312ac8e2abd92ae60c0f01)]:
  - @arc-platform/core@0.1.3

## 0.1.2

### Patch Changes

- [#34](https://github.com/MrPieterDreyer/Arc-Platform/pull/34) [`0043dfa`](https://github.com/MrPieterDreyer/Arc-Platform/commit/0043dfa90f779ca71eb6de081a309656590abd28) Thanks [@MrPieterDreyer](https://github.com/MrPieterDreyer)! - Enable Sigstore provenance attestations via the repo-root `.npmrc` `provenance=true` rc option — the mechanism `pnpm publish` actually reads (ADR-0012 S-1). The 0.1.0/0.1.1 tarballs shipped unattested because `publishConfig.provenance` and the `NPM_CONFIG_PROVENANCE` env var are npm-CLI mechanisms that pnpm, which changesets publishes through, ignores. No runtime changes.

- Updated dependencies [[`0043dfa`](https://github.com/MrPieterDreyer/Arc-Platform/commit/0043dfa90f779ca71eb6de081a309656590abd28)]:
  - @arc-platform/core@0.1.2

## 0.1.1

### Patch Changes

- [#32](https://github.com/MrPieterDreyer/Arc-Platform/pull/32) [`ac2203f`](https://github.com/MrPieterDreyer/Arc-Platform/commit/ac2203f60c0db5cea55c8a7f38e0be5aff67d8ea) Thanks [@MrPieterDreyer](https://github.com/MrPieterDreyer)! - Publish with npm provenance attestations via `publishConfig.provenance` (ADR-0012 S-1). The 0.1.0 tarballs shipped without attestations because the `NPM_CONFIG_PROVENANCE` environment variable is not honored when changesets publishes through pnpm; `publishConfig` is the package-manager-agnostic mechanism. No runtime changes.

- Updated dependencies [[`ac2203f`](https://github.com/MrPieterDreyer/Arc-Platform/commit/ac2203f60c0db5cea55c8a7f38e0be5aff67d8ea)]:
  - @arc-platform/core@0.1.1

## 0.1.0

### Minor Changes

- [`499936f`](https://github.com/MrPieterDreyer/Arc-Platform/commit/499936f0a1c7070c95c3ab07bd9ca544c97e7114) - Reconcile the Store API surface against a live WooCommerce backend, add a real error model, and make the core RSC-safe. Several changes are breaking (acceptable at `0.x`).

  **@arc-platform/core**

  - **RSC-safe entry split (breaking):** React hooks moved to a separate `@arc-platform/core/hooks` entry (guarded by `client-only`). The main `@arc-platform/core` barrel no longer pulls `useEffect`/`useOptimistic` into Server Components. Import hooks from `@arc-platform/core/hooks`.
  - **Normalized error model (ARC-API-03):** every thrown error is an `ArcClientError` carrying a discriminated `ArcError` (`api | network | parse`) on `.arcError`; adds `ArcNetworkError`, `ArcParseError`, and the `isArcError` guard. Network and JSON-parse failures are now normalized instead of propagating raw.
  - **Session-sticky `WooClient`:** captures the Cart-Token and Nonce from responses and replays them, so a write after an initial read is authenticated without external persistence callbacks.
  - **Cart field rename (breaking):** `WooCart.item_count` → `items_count` to match the live Store API.
  - **Coupons:** `applyCoupon`/`removeCoupon` re-fetch and return the updated cart (the endpoint returns the coupon resource, not the cart). `WooClient` coupon methods now hit the correct `/cart/coupons` endpoints.
  - **Customer:** Store API v1 has no `/customer` route — `getCustomer` derives session billing/shipping from the cart; `updateCustomer` uses `POST /cart/update-customer`.
  - **Checkout (breaking):** `getCheckoutSchema` now returns `WCCheckoutResponse` (the draft order), not a cart.
  - **Orders:** `getOrder` treats `woocommerce_rest_invalid_order` (401) as `null`. `getProductVariations` flattens WPGraphQL's `{ nodes }` attribute shape. Collections query uses `$slug: String!`.
  - Defensive (non-throwing) Zod validation of cart responses surfaces Store API shape drift in development.

  **@arc-platform/next**

  - Phase 2 App Router layer: `'use cache'` catalog loaders + `cacheTag`, cart-token cookie bridge, cart Server Action helpers, HMAC revalidate handler, `useOptimisticCart`, ISR profiles.
  - Loaders build the GraphQL client inside each `'use cache'` function (closing over a client instance is invalid in Next 16).
  - Exports `recommendedNextConfig` so consumers enable the required `cacheComponents: true`.

- [#27](https://github.com/MrPieterDreyer/Arc-Platform/pull/27) [`dae68ad`](https://github.com/MrPieterDreyer/Arc-Platform/commit/dae68ad8fc2a263bc6bb31cfe80368de012edffd) Thanks [@MrPieterDreyer](https://github.com/MrPieterDreyer)! - Wave-1 security hardening from the Hydrogen/Weaverse parity audit:

  - **Customer auth (ADR-0009, audit H-2)** — `@arc-platform/core` gains `loginCustomer()` and `refreshAuthToken()` WPGraphQL JWT mutations; `@arc-platform/next` gains an HttpOnly cookie bridge (`arc_auth_token` 15 min / `arc_refresh_token` 14 days, ADR-0006 attributes) plus server helpers `loginAction`, `logoutAction`, `getAuthToken`, `isAuthenticated`, and `loadCustomerOrders`. Raw JWT env-token auth in the example app is now gated behind `ARC_E2E_ALLOW_TOKEN_AUTH=true`.
  - **Security headers + CSP (ADR-0010, audit H-1)** — new `arcSecurityHeaders()` static header set and `createArcCsp()` nonce-based CSP builder exported from `@arc-platform/next`, with `useArcNonce()` for server components and a Next 16 `proxy.ts` reference implementation in the minimal-app example (report-only first).
  - **Catalog cache guard (audit CACHE-P1)** — `loadProduct`/`loadCollection` no longer cache null lookups: a sentinel error is thrown inside the `'use cache'` scope (errors are never cached) and translated back to `null` at the loader boundary.
  - **Cookie Secure override fail-closed (HANDOFF 1-F)** — `ARC_CART_COOKIE_SECURE=false` is ignored when `NODE_ENV === 'production'`.

### Patch Changes

- [#12](https://github.com/MrPieterDreyer/Arc-Platform/pull/12) [`1aa3862`](https://github.com/MrPieterDreyer/Arc-Platform/commit/1aa3862a37bdc2f54056d41040fd4632f4bc8dc4) Thanks [@MrPieterDreyer](https://github.com/MrPieterDreyer)! - Bootstrap WC Store API cart session (Cart-Token + Nonce) with GET `/cart` before mutating requests when a fresh `WooClient` instance lacks session state. Fixes headless add-to-cart and related Server Action flows that previously failed with `woocommerce_rest_missing_nonce`.

  Allow `ARC_CART_COOKIE_SECURE=false` for local HTTP E2E so `arc_cart_token` can be set on `http://localhost` storefronts; minimal-app Playwright config sets this automatically when the storefront URL is not HTTPS.

  Add `createReadOnlyCartClient` for Server Component cart reads so GET `/cart` during RSC cannot throw when WC rotates the Cart-Token (cookie writes are forbidden outside Server Actions). Wrap mutation-path cookie persistence in try/catch as a safety net.

- [`5adf8f2`](https://github.com/MrPieterDreyer/Arc-Platform/commit/5adf8f275d1fc68bd3d4255c3f19b21c4196213c) - Add MIT license and repository metadata to publishable packages.

- Updated dependencies [[`1aa3862`](https://github.com/MrPieterDreyer/Arc-Platform/commit/1aa3862a37bdc2f54056d41040fd4632f4bc8dc4), [`499936f`](https://github.com/MrPieterDreyer/Arc-Platform/commit/499936f0a1c7070c95c3ab07bd9ca544c97e7114), [`5adf8f2`](https://github.com/MrPieterDreyer/Arc-Platform/commit/5adf8f275d1fc68bd3d4255c3f19b21c4196213c), [`dae68ad`](https://github.com/MrPieterDreyer/Arc-Platform/commit/dae68ad8fc2a263bc6bb31cfe80368de012edffd)]:
  - @arc-platform/core@0.1.0
