import type { APIRequestContext } from '@playwright/test';

import { storeApiBase } from './store-api-checkout.js';

const CART_TOKEN_HEADER = 'Cart-Token';

export interface StoreApiCustomerAddressPatch {
  first_name?: string;
  last_name?: string;
  email?: string;
  address_1?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

/**
 * POST /cart/update-customer — session billing/shipping (ARC Store API v1).
 */
export async function updateStoreApiCustomer(
  request: APIRequestContext,
  wpUrl: string,
  cartToken: string,
  patch: {
    billing?: StoreApiCustomerAddressPatch;
    shipping?: StoreApiCustomerAddressPatch;
  },
): Promise<{ ok: boolean; status: number; email?: string }> {
  const body: {
    billing_address?: StoreApiCustomerAddressPatch;
    shipping_address?: StoreApiCustomerAddressPatch;
  } = {};
  if (patch.billing) body.billing_address = patch.billing;
  if (patch.shipping) body.shipping_address = patch.shipping;

  const res = await request.post(`${storeApiBase(wpUrl)}/cart/update-customer`, {
    data: body,
    headers: { [CART_TOKEN_HEADER]: cartToken },
    timeout: 15_000,
  });
  if (!res.ok()) {
    return { ok: false, status: res.status() };
  }
  const cart = (await res.json()) as {
    billing_address?: { email?: string };
  };
  return {
    ok: true,
    status: res.status(),
    email: cart.billing_address?.email,
  };
}
