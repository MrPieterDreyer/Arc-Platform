/**
 * @arc-platform/payment-stripe — buildStripePaymentData (D-08)
 *
 * Builds the exact `payment_data` array for the WC Stripe plugin's
 * deferred-intent + Confirmation Token flow. The deferred-intent key is
 * isolated behind a single exported constant so Plan 03's contract test
 * can disable it from one place if the pinned plugin version has removed it
 * (Pitfall 2 from the research spike).
 */
import type { WCPaymentData } from '@arc-platform/core';
import type { PaymentGateway, StripePaymentDataInput } from './gateway';

// ---------------------------------------------------------------------------
// Constants — single source of truth for all Stripe WC keys
// ---------------------------------------------------------------------------

export const STRIPE_GATEWAY_ID = 'stripe' as const;

export const STRIPE_CONFIRMATION_TOKEN_KEY = 'wc-stripe-confirmation-token' as const;

export const STRIPE_DEFERRED_INTENT_KEY = 'wc-stripe-is-deferred-intent' as const;

/**
 * Toggle for the deferred-intent payment_data key.
 *
 * Set to `false` in Plan 03's contract test if the pinned WC Stripe plugin
 * version no longer sends/requires this key (Pitfall 2). This is the ONLY
 * place in the codebase that controls whether the key is included.
 */
export const STRIPE_INCLUDE_DEFERRED_INTENT = true;

// ---------------------------------------------------------------------------
// buildStripePaymentData
// ---------------------------------------------------------------------------

/**
 * Builds the `payment_method` + `payment_data` fragment for a Stripe
 * Confirmation Token checkout submission.
 *
 * The returned object is merged into `WCCheckoutPayload` before calling
 * `submitCheckout`. It is a pure function — no network, no environment reads.
 *
 * @param input.confirmationTokenId - The `ctoken_…` id from Stripe Elements'
 *   `createConfirmationToken()` call (Plan 06 wires the UI).
 */
export function buildStripePaymentData(input: StripePaymentDataInput): {
  payment_method: typeof STRIPE_GATEWAY_ID;
  payment_data: WCPaymentData[];
} {
  const payment_data: WCPaymentData[] = [
    { key: STRIPE_CONFIRMATION_TOKEN_KEY, value: input.confirmationTokenId },
  ];

  if (STRIPE_INCLUDE_DEFERRED_INTENT) {
    payment_data.push({ key: STRIPE_DEFERRED_INTENT_KEY, value: 'true' });
  }

  return { payment_method: STRIPE_GATEWAY_ID, payment_data };
}

// ---------------------------------------------------------------------------
// stripeGateway — singleton PaymentGateway implementation
// ---------------------------------------------------------------------------

/**
 * The Stripe gateway singleton.
 *
 * Pass this to any function that accepts a `PaymentGateway` — it delegates
 * `buildPaymentData` to `buildStripePaymentData` above.
 */
export const stripeGateway: PaymentGateway = {
  id: STRIPE_GATEWAY_ID,
  buildPaymentData: buildStripePaymentData,
};
