/**
 * @arc-platform/payment-stripe — public barrel
 *
 * Re-exports the gateway interface, payment-data builder, and key constants.
 * Server-only exports (settlement poller) are behind the "./server" entry.
 * Client-only exports (Stripe Elements wrapper) are behind the "./client" entry.
 */

// Gateway interface + payment-data builder (Tasks 2-3 fill these in)
export type { PaymentGateway, StripePaymentDataInput } from './gateway';
export {
  STRIPE_CONFIRMATION_TOKEN_KEY,
  STRIPE_DEFERRED_INTENT_KEY,
  STRIPE_GATEWAY_ID,
  STRIPE_INCLUDE_DEFERRED_INTENT,
  buildStripePaymentData,
  stripeGateway,
} from './payment-data';
