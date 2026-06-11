import {
  assertNoCriticalAxeViolations,
  assertTabReachesSelectors,
} from '../../../../Scripts/e2e-shared/a11y';
import { assertNoRawApiErrors } from '../../../../Scripts/e2e-shared/design-assertions';

import { expect, test } from '../fixtures/backend';

const TEST_PRODUCT_SLUG = process.env.TEST_PRODUCT_SLUG ?? 'test-product';

test.describe('Wave 10 — accessibility @a11y', () => {
  test('home — no critical axe violations @a11y', async ({ page }) => {
    await page.goto('/');
    await assertNoCriticalAxeViolations(page);
    await assertNoRawApiErrors(page);
  });

  test('PLP — no critical axe violations @a11y', async ({ page, backendReady }) => {
    expect(backendReady.graphql).toBe(true);
    await page.goto('/products');
    await expect(page.getByTestId('plp-grid')).toBeVisible();
    await assertNoCriticalAxeViolations(page);
  });

  test('PDP — no critical axe violations @a11y', async ({ page, backendReady }) => {
    expect(backendReady.graphql).toBe(true);
    await page.goto(`/products/${TEST_PRODUCT_SLUG}`);
    await expect(page.getByTestId('add-to-cart')).toBeVisible();
    await assertNoCriticalAxeViolations(page);
  });

  test('checkout — axe + primary CTA reachable by keyboard @a11y', async ({
    page,
    backendReady,
  }) => {
    test.setTimeout(60_000);
    expect(backendReady.storeApi).toBe(true);

    await page.goto(`/products/${TEST_PRODUCT_SLUG}`);
    await page.getByTestId('add-to-cart').click();
    await page.goto('/checkout');
    await expect(page.getByTestId('checkout-summary')).toBeVisible();
    await assertNoCriticalAxeViolations(page);
    await assertTabReachesSelectors(page, ['[data-testid="checkout-proceed"]']);
  });

  test('cart badge is announced (aria-live) @a11y', async ({ page, backendReady }) => {
    expect(backendReady.storeApi).toBe(true);
    await page.goto('/');
    const badge = page.getByTestId('cart-badge');
    await expect(badge).toHaveAttribute('aria-live', 'polite');
  });
});
