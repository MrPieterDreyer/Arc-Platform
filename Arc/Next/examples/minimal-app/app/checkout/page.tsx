import Link from 'next/link';
import { Suspense } from 'react';

import { loadCheckoutPage } from '../../lib/load-checkout-page';

function formatMoney(totalMinor: string, symbol: string, minorUnit: number): string {
  const value = Number(totalMinor);
  if (!Number.isFinite(value)) return `${symbol}${totalMinor}`;
  const amount = value / 10 ** minorUnit;
  return `${symbol}${amount.toFixed(minorUnit)}`;
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<p data-testid="checkout-loading">Loading checkout…</p>}>
      <CheckoutContent />
    </Suspense>
  );
}

async function CheckoutContent() {
  const model = await loadCheckoutPage();

  return (
    <article data-testid="checkout-page">
      <h1 style={{ fontFamily: 'var(--font-display)', marginTop: 0 }}>Checkout</h1>

      {model.kind === 'empty' ? (
        <div data-testid="checkout-empty">
          <p>Your cart is empty.</p>
          <Link href="/products" data-testid="checkout-continue-shopping">
            Continue shopping
          </Link>
        </div>
      ) : null}

      {model.kind === 'error' ? (
        <p role="alert" data-testid="checkout-error">
          We could not load checkout. {model.message}
        </p>
      ) : null}

      {model.kind === 'ready' ? (
        <div data-testid="checkout-summary">
          <p data-testid="checkout-order-id">Draft order #{model.checkout.order_id}</p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Secure checkout — payment completes on WooCommerce (native gateways).
          </p>
          <ul
            data-testid="checkout-line-items"
            style={{ padding: 0, listStyle: 'none', margin: 'var(--space-4) 0' }}
          >
            {model.cart.items.map((item) => (
              <li
                key={item.key}
                data-testid="checkout-line-item"
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                {item.name} × {item.quantity}
              </li>
            ))}
          </ul>
          <p data-testid="checkout-total">
            Total:{' '}
            {formatMoney(
              model.cart.totals.total_price,
              model.cart.totals.currency_symbol,
              model.cart.totals.currency_minor_unit,
            )}
          </p>
          <a
            href={model.wcCheckoutUrl}
            data-testid="checkout-proceed"
            style={{
              display: 'inline-block',
              marginTop: 'var(--space-4)',
              minHeight: '44px',
              lineHeight: '44px',
              padding: '0 var(--space-4)',
              background: 'var(--btn-primary-bg)',
              color: 'var(--btn-primary-fg)',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Proceed to WooCommerce checkout
          </a>
        </div>
      ) : null}
    </article>
  );
}
