/**
 * @vitest-environment jsdom
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { WooCart } from '@arc/core';
import { useOptimisticCart } from '../use-optimistic-cart.js';

const baseCart: WooCart = {
  coupons: [],
  items: [],
  item_count: 2,
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
  items_weight: 0,
  cross_sells: [],
  has_calculated_shipping: false,
  needs_payment: false,
  needs_shipping: false,
  fees: [],
  errors: [],
  payment_requirements: [],
  extensions: {},
};

describe('ARC-NEXT-07 — useOptimisticCart', () => {
  it('increments count optimistically then settles after action resolves', async () => {
    let resolveAction!: (cart: WooCart) => void;
    const action = vi.fn(
      () =>
        new Promise<WooCart>((resolve) => {
          resolveAction = resolve;
        }),
    );

    const { result } = renderHook(() => useOptimisticCart(baseCart, action));

    act(() => {
      void result.current.add(99, 1);
    });

    await waitFor(() => {
      expect(result.current.cart?.item_count).toBe(3);
    });

    await act(async () => {
      resolveAction({ ...baseCart, item_count: 3 });
    });

    expect(action).toHaveBeenCalledWith({ id: 99, quantity: 1 });
  });

  it('reverts optimistic count when action rejects', async () => {
    const action = vi.fn(() => Promise.reject(new Error('network')));

    const { result } = renderHook(() => useOptimisticCart(baseCart, action));

    await act(async () => {
      await expect(result.current.add(1, 1)).rejects.toThrow('network');
    });

    await waitFor(() => {
      expect(result.current.cart?.item_count).toBe(2);
    });
  });
});
