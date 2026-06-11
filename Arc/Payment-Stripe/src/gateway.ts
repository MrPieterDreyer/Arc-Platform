/**
 * @arc-platform/payment-stripe — PaymentGateway interface (D-06)
 *
 * Generic enough that a future @arc-platform/payment-paypal can implement it
 * without changing callers. The input type is intentionally Stripe-specific for
 * now; Plan 06 / future payment packages will extend or widen this interface.
 */
import type { WCPaymentData } from '@arc-platform/core';

export interface StripePaymentDataInput {
  confirmationTokenId: string;
}

/**
 * A payment gateway adapter.
 *
 * Each gateway package (`@arc-platform/payment-stripe`, future `@arc-platform/payment-paypal`)
 * exports a singleton implementation of this interface. Callers depend on the
 * interface so they remain gateway-agnostic (D-06).
 */
export interface PaymentGateway {
  /** Gateway identifier as sent to WooCommerce as `payment_method`. */
  readonly id: string;

  /**
   * Builds the `{ payment_method, payment_data }` object to merge into the
   * WC Store API checkout payload. Never inspects network or environment —
   * pure transformation of the input token into the WC-expected shape.
   */
  buildPaymentData(input: StripePaymentDataInput): {
    payment_method: string;
    payment_data: WCPaymentData[];
  };
}
