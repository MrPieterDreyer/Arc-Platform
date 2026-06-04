---
"@arc/core": patch
"@arc/next": patch
---

Bootstrap WC Store API cart session (Cart-Token + Nonce) with GET `/cart` before mutating requests when a fresh `WooClient` instance lacks session state. Fixes headless add-to-cart and related Server Action flows that previously failed with `woocommerce_rest_missing_nonce`.

Allow `ARC_CART_COOKIE_SECURE=false` for local HTTP E2E so `arc_cart_token` can be set on `http://localhost` storefronts; minimal-app Playwright config sets this automatically when the storefront URL is not HTTPS.

Add `createReadOnlyCartClient` for Server Component cart reads so GET `/cart` during RSC cannot throw when WC rotates the Cart-Token (cookie writes are forbidden outside Server Actions). Wrap mutation-path cookie persistence in try/catch as a safety net.
