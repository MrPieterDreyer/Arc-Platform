---
"@arc-platform/payment-stripe": patch
---

Initial package: `@arc-platform/payment-stripe` — Stripe payment gateway adapter for Arc headless WooCommerce checkout. Provides the `PaymentGateway` interface (D-06, PayPal-ready), `buildStripePaymentData` (D-08 deferred-intent + Confirmation Token flow), and `resolveOrderSettlement` (D-09 server-authoritative order-status poll).
