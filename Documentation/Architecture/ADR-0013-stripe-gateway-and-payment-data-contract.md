# ADR-0013 — Stripe Gateway + Verified payment_data Contract

**Status:** Accepted
**Date:** 2026-06-11
**Deciders:** Pieter Dreyer
**Phase:** Phase 05 (Arc Pilot — Canonical Starter)
**Related requirements:** PILOT-03, PILOT-04

## Context

Plan 05-02 added `@arc-platform/payment-stripe` with `buildStripePaymentData()` and a
`STRIPE_INCLUDE_DEFERRED_INTENT` toggle, based on the hypothesis (from the research spike
`STRIPE-HEADLESS-WC-SPIKE.md`, decisions D-07–D-10) that `woocommerce-gateway-stripe`'s
deferred-intent UPE flow requires two `payment_data` keys:

- `wc-stripe-confirmation-token` — the `ctoken_…` id from `stripe.createConfirmationToken()`
- `wc-stripe-is-deferred-intent` — signals the deferred PaymentIntent UPE path

This left **Open Q1** (RESEARCH spike) unresolved: 2026 releases of the plugin may have
removed or renamed the deferred-intent key. Plan 05-03 pins an exact release and
contract-tests the live shape.

The WC Stripe plugin stores gateway settings in the `woocommerce_stripe_settings` WordPress
option. Sandbox test keys (`pk_test_` / `sk_test_`) are injected at seed time via
`Scripts/wp-seed/seed.php`; never committed to the repo.

**PILOT-04** requires a `Scripts/docker-compose.yml` artifact that boots the full stack.
This ADR also records that decision (see Task 4 in the same plan).

## Decision Drivers

- Pitfall 2 (spike): plugin version drift could silently break the `payment_data` contract
  if `wc-stripe-is-deferred-intent` is removed or replaced in a 2026 release.
- Arc's security boundary: the Stripe secret key must never leave WordPress; Arc Next holds
  only the publishable key and the webhook signing secret.
- D-07 (spike): use the official `woocommerce-gateway-stripe` plugin, not a custom
  PaymentIntents controller — keeps Arc dependency-free of the Stripe PHP SDK.
- D-09 (spike): WC order status set by the gateway webhook is the source of truth; client
  redirect params are not trusted.

## Considered Options

1. **Official `woocommerce-gateway-stripe` (pinned tag 9.8.0)** via Store API `POST /checkout`
2. Custom PaymentIntents controller in Arc (direct Stripe PHP SDK in WP)
3. CoCart payment extension

## Decision

Use the official `woocommerce-gateway-stripe` plugin, **pinned to tag 9.8.0** (GitHub release
zip: `https://github.com/woocommerce/woocommerce-gateway-stripe/releases/download/9.8.0/woocommerce-gateway-stripe.zip`),
installed in `.wp-env.json`. No custom PaymentIntents controller. No CoCart.

### Verified payment_data contract (PILOT-03 / Open Q1)

The contract test `Arc/Pilot/e2e/checkout/stripe-payment-data.contract.spec.ts` (Plan 05-03)
probes the live pinned backend to establish the exact accepted keys.

**Contract test findings (deferred to CI — no Docker on local Windows dev host):**

The test is structured as follows:

| Path | Token type | Assertion |
|------|-----------|-----------|
| PRIMARY | `ctoken_…` (Stripe.js `createConfirmationToken`) | Gateway does NOT return 400; `redirect_url` or `payment_result` present → intent created |
| PROBE | `ctoken_…` without `wc-stripe-is-deferred-intent` | Records whether the key is REQUIRED or NOT REQUIRED on 9.8.0 |
| HERMETIC FALLBACK | `pm_…` (server-side `paymentMethods.create`) | Gateway is installed, enabled, and recognises the `payment_method` field |

**`STRIPE_INCLUDE_DEFERRED_INTENT` status:**

Set to `true` in `Arc/Payment-Stripe/src/payment-data.ts` pending live CI verification.
The PROBE test in the contract spec will determine whether `wc-stripe-is-deferred-intent`
is required, optional, or dropped in 9.8.0. Update the toggle and this ADR after the first
CI run with `E2E_STRIPE_PUBLISHABLE_KEY` / `E2E_STRIPE_SECRET_KEY` set.

**Accepted `payment_data` keys (hypothesis, pending CI confirmation):**

```json
[
  { "key": "wc-stripe-confirmation-token", "value": "ctoken_…" },
  { "key": "wc-stripe-is-deferred-intent", "value": "true" }
]
```

The `wc-stripe-confirmation-token` key is confirmed as correct by the plugin source
(`WC_Stripe_UPE_Payment_Gateway::process_payment()` reads this key to retrieve the
Confirmation Token from Stripe and create / confirm the PaymentIntent server-side).

### Trust boundary

| Credential | Location | Never in |
|-----------|----------|---------|
| Stripe secret key (`sk_test_` / `sk_live_`) | WordPress `woocommerce_stripe_settings` option (WP DB) | Arc Next, git repo, env.example values |
| Publishable key (`pk_test_` / `pk_live_`) | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in Next.js | WP DB (it is not secret) |
| Webhook signing secret (`whsec_…`) | `STRIPE_WEBHOOK_SECRET` in Next.js | git repo (placeholder `whsec_xxx` only) |

The Arc Next app receives only `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and `STRIPE_WEBHOOK_SECRET`.
The WC order status set by the Stripe webhook is the authoritative payment result; Arc never
trusts `redirect_url` query params from Stripe (D-09).

### CART-P2: buyer identity

The Store API `/checkout` endpoint requires `billing_address.email` (at minimum) before
accepting a payment. `updateStoreApiCustomer()` in `Scripts/e2e-shared/store-api-customer.ts`
handles `POST /cart/update-customer` to attach billing/shipping before the Stripe POST.
The contract test verifies this path against the live backend (CART-P2).

### Payment gateways discovery

The Store API `/payment-gateways` route returns 404 in headless (non-cookie-session)
contexts. `getPaymentMethodsFromCheckout()` in `@arc-platform/core` reads the available
gateways from the `GET /checkout` response extensions field instead.

### PayPal

Deferred to v0.2 behind the `PaymentGateway` interface (`Arc/Payment-Stripe/src/gateway.ts`).
No code required in v0.1.

### Local http:// SameSite note

`ARC_CART_COOKIE_SECURE=false` must be set for local `http://localhost` development so the
Cart-Token cookie (SameSite=None by default per ADR-0006) is readable. The Stripe redirect
`return_url` must resolve to the same-site Next.js app (Pitfall 4 from the spike).

## Consequences

### Positive

- Plugin is maintained by WooCommerce/Automattic — security patches are upstream.
- Confirmation Token flow (deferred UPE) is the 2025/2026 recommended path (Stripe docs).
- Arc holds zero Stripe server-side credentials — no Arc-side CVE surface for key compromise.
- Contract is pinned to a specific plugin version, preventing silent breakage on update.

### Negative

- Plugin version must be manually bumped in `.wp-env.json` when upgrading (intentional —
  contract-tests must be re-verified against each new pin).
- Live contract test requires CI with Stripe sandbox keys; local dev on Windows (no Docker)
  defers live verification to CI.

### Neutral

- `STRIPE_INCLUDE_DEFERRED_INTENT` in `@arc-platform/payment-stripe` is the single toggle
  controlling whether `wc-stripe-is-deferred-intent` is included. Update to `false` if the
  PROBE test shows 9.8.0 ignores or rejects it.

## Implementation Notes

- Pinned plugin in `.wp-env.json`:
  `https://github.com/woocommerce/woocommerce-gateway-stripe/releases/download/9.8.0/woocommerce-gateway-stripe.zip`
- Seeder: `Scripts/wp-seed/seed.php` — writes `woocommerce_stripe_settings` option with
  `enabled=yes`, `testmode=yes`, `test_publishable_key`, `test_secret_key`.
- Seeder env: `SEED_STRIPE_TEST_PK` / `SEED_STRIPE_TEST_SK` (passed by `seed-wp-env.mjs`
  from `E2E_STRIPE_PUBLISHABLE_KEY` / `E2E_STRIPE_SECRET_KEY`).
- Contract test: `Arc/Pilot/e2e/checkout/stripe-payment-data.contract.spec.ts` tagged
  `@payment @contract`. Skips cleanly when `hasStripeSandboxEnv()` is false.
- PILOT-04 artifact: `Scripts/docker-compose.yml` — thin wrapper over `pnpm wp:setup`.
- Package: `@arc-platform/payment-stripe` — `buildStripePaymentData()` is the single source
  of truth for the `payment_data` array shape.

## References

- Research spike: `.planning/research/STRIPE-HEADLESS-WC-SPIKE.md` — decisions D-07 to D-10
- Contract test: `Arc/Pilot/e2e/checkout/stripe-payment-data.contract.spec.ts`
- Payment package: `Arc/Payment-Stripe/src/payment-data.ts` (`STRIPE_INCLUDE_DEFERRED_INTENT`)
- WC Stripe plugin source: `includes/payment-methods/class-wc-stripe-upe-payment-gateway.php`
- [WooCommerce Store API Cart Tokens](https://developer.woocommerce.com/docs/apis/store-api/cart-tokens/)
- [Stripe Confirmation Tokens](https://stripe.com/docs/api/confirmation_tokens)
- ADR-0006: Cart-Token cookie name + scope
- ADR-0009: Customer authentication strategy
