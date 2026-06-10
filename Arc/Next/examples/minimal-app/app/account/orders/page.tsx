import Link from 'next/link';

import { loadAccountOrders } from '../../../lib/load-account-orders';

export default async function AccountOrdersPage() {
  const model = await loadAccountOrders();

  return (
    <article data-testid="account-orders-page">
      <h1 style={{ fontFamily: 'var(--font-display)', marginTop: 0 }}>Order history</h1>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
        <Link href="/account">← Account</Link>
      </p>

      {model.kind === 'no-auth' ? (
        <div data-testid="account-orders-unauthenticated">
          <p>
            You are not signed in. <Link href="/account/login">Sign in</Link> to view your order
            history (WPGraphQL JWT cookie bridge, ADR-0009).
          </p>
        </div>
      ) : null}

      {model.kind === 'error' ? (
        <p role="alert" data-testid="account-orders-error">
          {model.message}
        </p>
      ) : null}

      {model.kind === 'ready' ? (
        <div data-testid="account-orders-list">
          <p data-testid="account-orders-customer">
            {model.customer.firstName} {model.customer.lastName} ({model.customer.email})
          </p>
          {model.customer.orders.nodes.length === 0 ? (
            <p data-testid="account-orders-empty">No orders yet.</p>
          ) : (
            <ul
              style={{ padding: 0, listStyle: 'none', margin: 'var(--space-4) 0' }}
              data-testid="account-orders-items"
            >
              {model.customer.orders.nodes.map((order) => (
                <li
                  key={order.databaseId}
                  data-testid="account-order-row"
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  <strong>#{order.orderNumber}</strong> — {order.status} — {order.total} —{' '}
                  {order.date}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </article>
  );
}
