import Link from 'next/link';
import { Suspense } from 'react';

import { loadAccountSession } from '../../lib/load-account-session';

export default function AccountPage() {
  return (
    <Suspense fallback={<p data-testid="account-loading">Loading account…</p>}>
      <AccountContent />
    </Suspense>
  );
}

async function AccountContent() {
  const model = await loadAccountSession();

  return (
    <article data-testid="account-page">
      <h1 style={{ fontFamily: 'var(--font-display)', marginTop: 0 }}>Account</h1>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
        Session-scoped billing from the cart (Store API). Full login deferred —{' '}
        <Link href="/account/orders">order history</Link> requires JWT (ADR-0009).
      </p>

      {model.kind === 'error' ? (
        <p role="alert" data-testid="account-error">
          {model.message}
        </p>
      ) : null}

      {model.kind === 'ready' ? (
        <>
          <p data-testid="account-email">
            {model.customer.billing.email ||
              model.customer.email ||
              'No billing email on this cart session yet.'}
          </p>
          <address
            data-testid="account-billing"
            style={{ fontStyle: 'normal', marginTop: 'var(--space-4)' }}
          >
            {model.customer.billing.first_name} {model.customer.billing.last_name}
            <br />
            {model.customer.billing.address_1}
            <br />
            {model.customer.billing.city}, {model.customer.billing.state}{' '}
            {model.customer.billing.postcode}
          </address>
          <p style={{ marginTop: 'var(--space-6)' }}>
            <Link href="/products" data-testid="account-continue-shopping">
              Continue shopping
            </Link>
          </p>
        </>
      ) : null}
    </article>
  );
}
