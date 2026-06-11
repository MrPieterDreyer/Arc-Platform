/**
 * @arc-platform/payment-stripe — payment-data unit tests (D-08)
 *
 * Covers: buildStripePaymentData shape, deferred-intent toggle isolation,
 * gateway id literal, and PaymentGateway interface conformance.
 */
import { describe, expect, it } from 'vitest';
import type { PaymentGateway } from './gateway';
import {
  STRIPE_CONFIRMATION_TOKEN_KEY,
  STRIPE_DEFERRED_INTENT_KEY,
  STRIPE_GATEWAY_ID,
  STRIPE_INCLUDE_DEFERRED_INTENT,
  buildStripePaymentData,
  stripeGateway,
} from './payment-data';

describe('buildStripePaymentData', () => {
  it('returns payment_method === "stripe" (never "stripe_source")', () => {
    const result = buildStripePaymentData({ confirmationTokenId: 'ctoken_abc' });
    expect(result.payment_method).toBe('stripe');
  });

  it('includes the confirmation token key with the supplied value', () => {
    const result = buildStripePaymentData({ confirmationTokenId: 'ctoken_abc' });
    const tokenEntry = result.payment_data.find((d) => d.key === 'wc-stripe-confirmation-token');
    expect(tokenEntry).toBeDefined();
    expect(tokenEntry?.value).toBe('ctoken_abc');
  });

  it('includes the deferred-intent key when STRIPE_INCLUDE_DEFERRED_INTENT is true (default)', () => {
    // Default export value is true — the deferred-intent entry must be present.
    if (!STRIPE_INCLUDE_DEFERRED_INTENT) {
      // If Plan 03 flips the constant to false, this branch documents the
      // expected absence rather than failing the test suite.
      const result = buildStripePaymentData({ confirmationTokenId: 'ctoken_xyz' });
      const deferredEntry = result.payment_data.find(
        (d) => d.key === 'wc-stripe-is-deferred-intent',
      );
      expect(deferredEntry).toBeUndefined();
    } else {
      const result = buildStripePaymentData({ confirmationTokenId: 'ctoken_xyz' });
      const deferredEntry = result.payment_data.find(
        (d) => d.key === 'wc-stripe-is-deferred-intent',
      );
      expect(deferredEntry).toBeDefined();
      expect(deferredEntry?.value).toBe('true');
    }
  });

  it('STRIPE_INCLUDE_DEFERRED_INTENT is a single exported constant (Plan 03 toggle point)', () => {
    // The constant must be a boolean so Plan 03 can set it to false in one place.
    expect(typeof STRIPE_INCLUDE_DEFERRED_INTENT).toBe('boolean');
  });

  it('key constants match the values used in payment_data entries', () => {
    const result = buildStripePaymentData({ confirmationTokenId: 'ctoken_test' });
    const keys = result.payment_data.map((d) => d.key);
    expect(keys).toContain(STRIPE_CONFIRMATION_TOKEN_KEY);
    if (STRIPE_INCLUDE_DEFERRED_INTENT) {
      expect(keys).toContain(STRIPE_DEFERRED_INTENT_KEY);
    }
  });

  it('payment_method literal matches STRIPE_GATEWAY_ID constant', () => {
    const result = buildStripePaymentData({ confirmationTokenId: 'ctoken_abc' });
    expect(result.payment_method).toBe(STRIPE_GATEWAY_ID);
    expect(STRIPE_GATEWAY_ID).toBe('stripe');
  });
});

describe('stripeGateway (PaymentGateway interface)', () => {
  it('has id === "stripe"', () => {
    expect(stripeGateway.id).toBe('stripe');
  });

  it('conforms to the PaymentGateway interface shape', () => {
    // Type-level check: assignment to PaymentGateway must compile.
    const gateway: PaymentGateway = stripeGateway;
    expect(typeof gateway.id).toBe('string');
    expect(typeof gateway.buildPaymentData).toBe('function');
  });

  it('buildPaymentData delegates to buildStripePaymentData', () => {
    const direct = buildStripePaymentData({ confirmationTokenId: 'ctoken_via_gateway' });
    const viaGateway = stripeGateway.buildPaymentData({
      confirmationTokenId: 'ctoken_via_gateway',
    });
    expect(viaGateway).toEqual(direct);
  });
});
