import {
  assertNoRawApiErrors,
  assertPrimaryCtaAccent,
} from '../../../../../../Scripts/e2e-shared/design-assertions';

import { expect, test } from '../fixtures/backend';

const TEST_PRODUCT_SLUG = process.env.TEST_PRODUCT_SLUG ?? 'test-product';

test.describe('Wave 6 — checkout UI @regression', () => {
  test('empty checkout shows continue shopping @regression', async ({ page, backendReady }) => {
    expect(backendReady.storeApi).toBe(true);
    await page.goto('/checkout');
    await expect(page.getByTestId('checkout-page')).toBeVisible();
    await expect(page.getByTestId('checkout-empty')).toBeVisible();
    await expect(page.getByTestId('checkout-continue-shopping')).toBeVisible();
    await assertNoRawApiErrors(page);
  });

  test('add to cart → checkout summary and primary handoff CTA @regression', async ({
    page,
    backendReady,
  }) => {
    test.setTimeout(60_000);
    expect(backendReady.storeApi).toBe(true);

    await page.goto(`/products/${TEST_PRODUCT_SLUG}`);
    await expect(page.getByTestId('add-to-cart')).toBeVisible();
    await page.getByTestId('add-to-cart').click();

    await expect
      .poll(async () => {
        // Scope to the header badge ("Cart (N)") — the PDP also renders a `cart-badge` status
        // ("Updating cart…"), so an unscoped locator matches 2 elements (strict-mode violation).
        // Matches the scoping used in cart/cookie.spec.ts + cart/optimistic.spec.ts.
        const text = (await page.locator('header').getByTestId('cart-badge').textContent()) ?? '';
        const match = text.match(/(\d+)/);
        return match ? Number.parseInt(match[1], 10) : 0;
      })
      .toBeGreaterThan(0);

    await page.goto('/checkout');
    await expect(page.getByTestId('checkout-summary')).toBeVisible();
    await expect(page.getByTestId('checkout-order-id')).toContainText(/Draft order #\d+/);
    await expect(page.getByTestId('checkout-line-items')).toBeVisible();
    await expect(page.getByTestId('checkout-line-item').first()).toBeVisible();
    await expect(page.getByTestId('checkout-proceed')).toBeVisible();

    await assertPrimaryCtaAccent(page, '[data-testid="checkout-proceed"]');
    await assertNoRawApiErrors(page);
  });
});
