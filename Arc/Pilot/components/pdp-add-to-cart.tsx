'use client';

import type { WooCart } from '@arc-platform/core';
import { useOptimisticCart } from '@arc-platform/next/client';
import { useState } from 'react';
import { addItemAction } from '../app/actions/cart';
import { emitCartCount } from '../lib/cart-sync';

const emptyCart: WooCart = {
  coupons: [],
  shipping_rates: [],
  shipping_address: {
    first_name: '',
    last_name: '',
    company: '',
    address_1: '',
    address_2: '',
    city: '',
    state: '',
    postcode: '',
    country: '',
    phone: '',
  },
  billing_address: {
    first_name: '',
    last_name: '',
    company: '',
    address_1: '',
    address_2: '',
    city: '',
    state: '',
    postcode: '',
    country: '',
    email: '',
    phone: '',
  },
  items: [],
  items_count: 0,
  items_weight: 0,
  cross_sells: [],
  needs_payment: false,
  needs_shipping: false,
  has_calculated_shipping: false,
  fees: [],
  totals: {
    total_items: '0',
    total_items_tax: '0',
    total_fees: '0',
    total_fees_tax: '0',
    total_discount: '0',
    total_discount_tax: '0',
    total_shipping: '0',
    total_shipping_tax: '0',
    total_price: '0',
    total_tax: '0',
    tax_lines: [],
    currency_code: 'USD',
    currency_symbol: '$',
    currency_minor_unit: 2,
    currency_decimal_separator: '.',
    currency_thousand_separator: ',',
    currency_prefix: '$',
    currency_suffix: '',
  },
  errors: [],
  payment_requirements: [],
  extensions: {},
};

export function PdpAddToCart({
  productId,
  initialCart,
}: {
  productId: number;
  initialCart: WooCart | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [baseCart, setBaseCart] = useState<WooCart | null>(initialCart ?? emptyCart);
  const { cart, add, isPending, pendingLabel, errorLabel } = useOptimisticCart(
    baseCart,
    async (payload) => {
      setError(null);
      const next = await addItemAction(payload);
      setBaseCart(next);
      emitCartCount(next.items_count ?? 0);
      return next;
    },
  );

  const count = cart?.items_count ?? 0;
  const lineItems = cart?.items ?? [];

  return (
    <div style={{ marginTop: 'var(--space-4)' }}>
      <p
        data-testid="cart-badge"
        aria-live="polite"
        style={{
          color: count > 0 ? 'var(--color-accent)' : 'var(--color-text-muted)',
          fontWeight: count > 0 ? 600 : 400,
        }}
      >
        {isPending ? pendingLabel : `Cart items: ${count}`}
      </p>
      {error ? (
        <p role="alert" data-testid="cart-error">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        data-testid="add-to-cart"
        disabled={isPending}
        style={{
          marginTop: 'var(--space-2)',
          minHeight: '44px',
          width: '100%',
          maxWidth: '20rem',
          background: 'var(--btn-primary-bg)',
          color: 'var(--btn-primary-fg)',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          fontFamily: 'var(--font-sans)',
          fontWeight: 600,
          cursor: isPending ? 'wait' : 'pointer',
        }}
        onClick={() => {
          void add(productId, 1).catch(() => setError(errorLabel));
        }}
      >
        Add to cart
      </button>
      {lineItems.length > 0 ? (
        <ul
          data-testid="cart-line-items"
          style={{
            marginTop: 'var(--space-4)',
            padding: 0,
            listStyle: 'none',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          {lineItems.map((item) => (
            <li
              key={item.key}
              data-testid="cart-line-item"
              style={{
                padding: 'var(--space-3) var(--space-4)',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              {item.name} × {item.quantity}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
