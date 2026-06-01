'use client';

import { useState } from 'react';
import type { WooCart } from '@arc/core';
import { useOptimisticCart } from '@arc/next/client';
import { addItemAction } from '../app/actions/cart';

const stubCart: WooCart | null = {
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
  item_count: 0,
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

export function OptimisticCartDemo() {
  const [error, setError] = useState<string | null>(null);
  const { cart, add, isPending, pendingLabel, errorLabel } = useOptimisticCart(
    stubCart,
    async (payload) => {
      setError(null);
      return addItemAction(payload);
    },
  );

  const count = cart?.item_count ?? 0;

  return (
    <section aria-labelledby="cart-demo-title">
      <h2 id="cart-demo-title">Optimistic cart</h2>
      <p
        aria-live="polite"
        style={{
          color: count > 0 ? 'var(--color-accent)' : 'var(--color-text-muted)',
          fontWeight: count > 0 ? 600 : 400,
        }}
      >
        {isPending ? pendingLabel : `Cart items: ${count}`}
      </p>
      {error ? <p role="alert">{error}</p> : null}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-4)',
          alignItems: 'center',
          padding: 'var(--space-4)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <span>Stub product</span>
        <button
          type="button"
          style={{
            background: 'var(--color-accent)',
            color: 'var(--color-on-accent, #fff)',
            border: 'none',
            padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
          }}
          disabled={isPending}
          onClick={() => {
            void add(1, 1).catch(() => setError(errorLabel));
          }}
        >
          Add to cart
        </button>
      </div>
    </section>
  );
}
