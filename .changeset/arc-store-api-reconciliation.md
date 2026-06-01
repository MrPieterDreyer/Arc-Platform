---
"@arc/core": minor
"@arc/next": minor
---

Reconcile the Store API surface against a live WooCommerce backend, add a real error model, and make the core RSC-safe. Several changes are breaking (acceptable at `0.x`).

**@arc/core**

- **RSC-safe entry split (breaking):** React hooks moved to a separate `@arc/core/hooks` entry (guarded by `client-only`). The main `@arc/core` barrel no longer pulls `useEffect`/`useOptimistic` into Server Components. Import hooks from `@arc/core/hooks`.
- **Normalized error model (ARC-API-03):** every thrown error is an `ArcClientError` carrying a discriminated `ArcError` (`api | network | parse`) on `.arcError`; adds `ArcNetworkError`, `ArcParseError`, and the `isArcError` guard. Network and JSON-parse failures are now normalized instead of propagating raw.
- **Session-sticky `WooClient`:** captures the Cart-Token and Nonce from responses and replays them, so a write after an initial read is authenticated without external persistence callbacks.
- **Cart field rename (breaking):** `WooCart.item_count` → `items_count` to match the live Store API.
- **Coupons:** `applyCoupon`/`removeCoupon` re-fetch and return the updated cart (the endpoint returns the coupon resource, not the cart). `WooClient` coupon methods now hit the correct `/cart/coupons` endpoints.
- **Customer:** Store API v1 has no `/customer` route — `getCustomer` derives session billing/shipping from the cart; `updateCustomer` uses `POST /cart/update-customer`.
- **Checkout (breaking):** `getCheckoutSchema` now returns `WCCheckoutResponse` (the draft order), not a cart.
- **Orders:** `getOrder` treats `woocommerce_rest_invalid_order` (401) as `null`. `getProductVariations` flattens WPGraphQL's `{ nodes }` attribute shape. Collections query uses `$slug: String!`.
- Defensive (non-throwing) Zod validation of cart responses surfaces Store API shape drift in development.

**@arc/next**

- Phase 2 App Router layer: `'use cache'` catalog loaders + `cacheTag`, cart-token cookie bridge, cart Server Action helpers, HMAC revalidate handler, `useOptimisticCart`, ISR profiles.
- Loaders build the GraphQL client inside each `'use cache'` function (closing over a client instance is invalid in Next 16).
- Exports `recommendedNextConfig` so consumers enable the required `cacheComponents: true`.
