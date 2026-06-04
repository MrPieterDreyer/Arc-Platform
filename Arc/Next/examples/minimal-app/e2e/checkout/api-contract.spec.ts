import { getE2eEnv, seededProductId } from '../../../../../../Scripts/e2e-shared/e2e-env';
import {
  fetchStoreApiCheckoutDraft,
  seedStoreApiCart,
} from '../../../../../../Scripts/e2e-shared/store-api-checkout';

import { expect, test } from '../fixtures/backend';

test.describe('Wave 6 — Store API checkout draft @regression', () => {
  test('GET /checkout returns order_id after cart add @regression', async ({
    request,
    backendReady,
  }) => {
    test.setTimeout(120_000);
    const productId = seededProductId();
    test.skip(!productId, 'TEST_PRODUCT_ID required — run pnpm wp:setup');
    expect(backendReady.storeApi).toBe(true);
    const { wpUrl } = getE2eEnv();

    const { cartToken, itemsCount } = await seedStoreApiCart(request, wpUrl, productId);
    expect(itemsCount).toBeGreaterThan(0);
    expect(cartToken.length).toBeGreaterThan(0);

    const { ok, draft } = await fetchStoreApiCheckoutDraft(request, wpUrl, cartToken);
    expect(ok).toBe(true);
    expect(draft).not.toBeNull();
    expect(draft?.order_id).toBeGreaterThan(0);
    expect(draft).toHaveProperty('billing_address');
    expect(draft).toHaveProperty('shipping_address');
  });
});
