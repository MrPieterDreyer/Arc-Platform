# Payment sandbox E2E

**When:** Nightly and manual CI (`workflow_dispatch`) only — not PR smoke.

## Stripe (PILOT-03 pattern)

1. Use WooCommerce Stripe gateway in **test mode** on wp-env or staging
2. Set `STRIPE_PUBLISHABLE_KEY` / `STRIPE_SECRET_KEY` in `.env` (see `.env.example`)
3. Playwright: fill Stripe test card `4242 4242 4242 4242`, any future expiry, any CVC
4. Assert order confirmation route or thank-you heading

Tag tests `@payment`.

## PayPal sandbox

1. Configure PayPal sandbox app credentials
2. Use PayPal’s sandbox buyer account in hosted flow
3. Assert return URL and order status via Store API or account page

## Agent tickets

Failures must include gateway response snippet (redacted), screenshot at payment step, and `requirementIds: ["PILOT-03"]` when applicable.
