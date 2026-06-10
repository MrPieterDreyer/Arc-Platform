'use client';

import type { WooCart } from '@arc-platform/core';
import { useOptimisticCart } from '@arc-platform/next/client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { addItemAction, addItemActionFail } from '../app/actions/cart';
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

function testProductId(): number {
  const raw = process.env.NEXT_PUBLIC_TEST_PRODUCT_ID ?? process.env.TEST_PRODUCT_ID ?? '1';
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : 1;
}

export function OptimisticCartDemo() {
  const [error, setError] = useState<string | null>(null);
  const [baseCart, setBaseCart] = useState<WooCart | null>(emptyCart);
  const forceFailRef = useRef(false);
  const productId = testProductId();

  const { cart, add, isPending, pendingLabel, errorLabel } = useOptimisticCart(
    baseCart,
    async (payload) => {
      if (forceFailRef.current) {
        forceFailRef.current = false;
        return addItemActionFail(payload);
      }
      const next = await addItemAction(payload);
      setBaseCart(next);
      emitCartCount(next.items_count ?? 0);
      return next;
    },
  );

  const count = cart?.items_count ?? 0;

  return (
    <section aria-labelledby="cart-demo-title">
      <h2 id="cart-demo-title">Optimistic cart</h2>
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
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-4)',
          alignItems: 'center',
          flexWrap: 'wrap',
          padding: 'var(--space-4)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <span>Stub product</span>
        <button
          type="button"
          data-testid="add-to-cart"
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
            setError(null);
            void add(productId, 1).catch(() => setError(errorLabel));
          }}
        >
          Add to cart
        </button>
        <button
          type="button"
          data-testid="add-to-cart-fail"
          disabled={isPending}
          style={{
            background: 'transparent',
            color: 'var(--color-text-muted)',
            border: '1px solid var(--color-border)',
            padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
          }}
          onClick={() => {
            setError(null);
            forceFailRef.current = true;
            void add(productId, 1).catch(() => setError(errorLabel));
          }}
        >
          Add (fail)
        </button>
      </div>
      {(cart?.items?.length ?? 0) > 0 ? (
        <>
          <ul
            data-testid="cart-line-items"
            style={{ marginTop: 'var(--space-4)', padding: 0, listStyle: 'none' }}
          >
            {cart?.items.map((item) => (
              <li key={item.key} data-testid="cart-line-item">
                {item.name} × {item.quantity}
              </li>
            ))}
          </ul>
          <Link
            href="/checkout"
            data-testid="proceed-to-checkout"
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
            Proceed to checkout
          </Link>
        </>
      ) : null}
    </section>
  );
}
