/**
 * @arc-platform/core — getPaymentMethodsFromCheckout unit tests (CART-P2)
 *
 * Pure function tests — no network. Covers: empty draft, payment_requirements
 * array, extensions object keys, payment_method field, and deduplication.
 */
import { describe, expect, it } from 'vitest';
import { getPaymentMethodsFromCheckout } from './checkout';

describe('getPaymentMethodsFromCheckout', () => {
  it('returns [] for an empty draft object', () => {
    expect(getPaymentMethodsFromCheckout({})).toEqual([]);
  });

  it('returns [] when payment_requirements is an empty array', () => {
    expect(getPaymentMethodsFromCheckout({ payment_requirements: [] })).toEqual([]);
  });

  it('extracts gateway ids from payment_requirements', () => {
    const result = getPaymentMethodsFromCheckout({
      payment_requirements: ['stripe', 'paypal'],
    });
    expect(result).toContain('stripe');
    expect(result).toContain('paypal');
  });

  it('includes "stripe" when payment_requirements contains "stripe"', () => {
    const result = getPaymentMethodsFromCheckout({
      payment_requirements: ['stripe'],
    });
    expect(result).toContain('stripe');
  });

  it('extracts gateway ids from extensions object keys', () => {
    const result = getPaymentMethodsFromCheckout({
      extensions: { stripe: { someData: true }, bacs_transfer: {} },
    });
    expect(result).toContain('stripe');
    expect(result).toContain('bacs_transfer');
  });

  it('extracts gateway id from payment_method field', () => {
    const result = getPaymentMethodsFromCheckout({ payment_method: 'stripe' });
    expect(result).toContain('stripe');
  });

  it('deduplicates when the same gateway appears in multiple sources', () => {
    const result = getPaymentMethodsFromCheckout({
      payment_requirements: ['stripe'],
      extensions: { stripe: {} },
      payment_method: 'stripe',
    });
    const stripeCount = result.filter((id) => id === 'stripe').length;
    expect(stripeCount).toBe(1);
  });

  it('ignores non-string entries in payment_requirements', () => {
    const result = getPaymentMethodsFromCheckout({
      // @ts-expect-error — testing runtime resilience against malformed data
      payment_requirements: [null, 42, 'stripe', undefined],
    });
    expect(result).toContain('stripe');
    expect(result).not.toContain(null);
    expect(result).not.toContain(42);
  });

  it('ignores extension keys that look like namespaced WP slugs (contain slashes/dots)', () => {
    const result = getPaymentMethodsFromCheckout({
      extensions: {
        'woocommerce/checkout': {},
        'some.plugin': {},
        stripe: {},
      },
    });
    expect(result).toContain('stripe');
    expect(result).not.toContain('woocommerce/checkout');
    expect(result).not.toContain('some.plugin');
  });
});
