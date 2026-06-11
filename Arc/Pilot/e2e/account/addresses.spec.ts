import { getE2eEnv, seededProductId } from '../../../../Scripts/e2e-shared/e2e-env';
import { assertNoRawApiErrors } from '../../../../Scripts/e2e-shared/design-assertions';
import { seedStoreApiCart } from '../../../../Scripts/e2e-shared/store-api-checkout';
import { updateStoreApiCustomer } from '../../../../Scripts/e2e-shared/store-api-customer';

import { expect, test } from '../fixtures/backend';

const ARC_CART_TOKEN = 'arc_cart_token';
const TEST_EMAIL = 'e2e-account@example.com';

test.describe('Wave 7 — session addresses @regression', () => {
  test('cart session billing appears on /account @regression', async ({
    page,
    request,
    backendReady,
  }) => {
    test.setTimeout(60_000);
    const productId = seededProductId();
    test.skip(!productId, 'TEST_PRODUCT_ID required — run pnpm wp:setup');
    expect(backendReady.storeApi).toBe(true);

    const env = getE2eEnv();
    const { cartToken } = await seedStoreApiCart(request, env.wpUrl, productId);
    const updated = await updateStoreApiCustomer(request, env.wpUrl, cartToken, {
      billing: {
        first_name: 'E2E',
        last_name: 'Account',
        email: TEST_EMAIL,
        address_1: '1 Test Lane',
        city: 'Austin',
        state: 'TX',
        postcode: '78701',
        country: 'US',
      },
    });
    expect(updated.ok).toBe(true);
    expect(updated.email).toBe(TEST_EMAIL);

    const storefront = env.storefrontUrl;
    const cookieUrl = storefront.endsWith('/') ? storefront : `${storefront}/`;
    const cookieSecure = storefront.startsWith('https://');
    await page.context().addCookies([
      {
        name: ARC_CART_TOKEN,
        value: cartToken,
        url: cookieUrl,
        httpOnly: true,
        secure: cookieSecure,
        sameSite: cookieSecure ? 'None' : 'Lax',
      },
    ]);

    await page.goto('/account');
    await expect(page.getByTestId('account-page')).toBeVisible();
    await expect(page.getByTestId('account-email')).toContainText(TEST_EMAIL);
    await expect(page.getByTestId('account-billing')).toContainText('1 Test Lane');
    await assertNoRawApiErrors(page);
  });
});
