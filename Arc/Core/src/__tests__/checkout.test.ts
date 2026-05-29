/**
 * Unit tests for src/store-api/checkout.ts
 *
 * Tests verify that each function delegates to WooClient.request() with
 * the correct HTTP method, path, and payload. No live WP env required.
 */
import { describe, expect, it, vi } from 'vitest';
import { WooClient } from '../client/WooClient';
import {
  getCheckoutSchema,
  getPaymentGateways,
  submitCheckout,
} from '../store-api/checkout';
import type { WCCheckoutPayload } from '../types/checkout';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeClient(): { client: WooClient; requestSpy: ReturnType<typeof vi.spyOn> } {
  const client = new WooClient({ baseUrl: 'http://localhost:8888' });
  const requestSpy = vi.spyOn(client, 'request').mockResolvedValue({} as never);
  return { client, requestSpy };
}

// ---------------------------------------------------------------------------
// getCheckoutSchema
// ---------------------------------------------------------------------------

describe('getCheckoutSchema', () => {
  it('calls GET /checkout on WooClient', async () => {
    const { client, requestSpy } = makeClient();
    await getCheckoutSchema(client);
    expect(requestSpy).toHaveBeenCalledWith('/checkout');
  });
});

// ---------------------------------------------------------------------------
// getPaymentGateways
// ---------------------------------------------------------------------------

describe('getPaymentGateways', () => {
  it('calls GET /payment-gateways on WooClient', async () => {
    const { client, requestSpy } = makeClient();
    await getPaymentGateways(client);
    expect(requestSpy).toHaveBeenCalledWith('/payment-gateways');
  });
});

// ---------------------------------------------------------------------------
// submitCheckout
// ---------------------------------------------------------------------------

describe('submitCheckout', () => {
  it('calls POST /checkout with the payload body', async () => {
    const { client, requestSpy } = makeClient();
    const payload: WCCheckoutPayload = {
      billing_address: {
        first_name: 'Jane',
        last_name: 'Doe',
        company: '',
        address_1: '1 Main St',
        address_2: '',
        city: 'Cape Town',
        state: 'WC',
        postcode: '8001',
        country: 'ZA',
        phone: '0001112222',
        email: 'jane@example.com',
      },
      shipping_address: {
        first_name: 'Jane',
        last_name: 'Doe',
        company: '',
        address_1: '1 Main St',
        address_2: '',
        city: 'Cape Town',
        state: 'WC',
        postcode: '8001',
        country: 'ZA',
        phone: '0001112222',
      },
      payment_method: 'stripe',
      payment_data: [{ key: 'stripe_source', value: 'tok_test' }],
    };
    await submitCheckout(client, payload);
    expect(requestSpy).toHaveBeenCalledWith('/checkout', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  });

  it('does not transform payment_data — passes gateway tokens verbatim', async () => {
    const { client, requestSpy } = makeClient();
    const sensitivePayload: WCCheckoutPayload = {
      billing_address: {
        first_name: 'A',
        last_name: 'B',
        company: '',
        address_1: 'X',
        address_2: '',
        city: 'Y',
        state: 'Z',
        postcode: '000',
        country: 'ZA',
        phone: '000',
        email: 'a@b.com',
      },
      shipping_address: {
        first_name: 'A',
        last_name: 'B',
        company: '',
        address_1: 'X',
        address_2: '',
        city: 'Y',
        state: 'Z',
        postcode: '000',
        country: 'ZA',
        phone: '000',
      },
      payment_method: 'paypal',
      payment_data: [
        { key: 'paypal_order_id', value: 'ORDER_123' },
        { key: 'paypal_payer_id', value: 'PAYER_456' },
      ],
    };
    await submitCheckout(client, sensitivePayload);
    const call = requestSpy.mock.calls[0];
    const body = JSON.parse((call[1] as { body: string }).body);
    expect(body.payment_data).toEqual(sensitivePayload.payment_data);
  });
});
