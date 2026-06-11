import {
  assertBodyTextPrimary,
  assertFocusRingUsesAccent,
  assertNoRawApiErrors,
  assertPrimaryCtaAccent,
} from '../../../../Scripts/e2e-shared/design-assertions';

import { expect, test } from '../fixtures/backend';

const TEST_PRODUCT_SLUG = process.env.TEST_PRODUCT_SLUG ?? 'test-product';

test.describe('Wave 2 — catalog PDP @regression', () => {
  test('PDP renders SSR title and price @regression', async ({ page, backendReady }) => {
    expect(backendReady.graphql).toBe(true);

    const res = await page.goto(`/products/${TEST_PRODUCT_SLUG}`);
    expect(res?.ok()).toBeTruthy();

    await expect(page.getByTestId('pdp')).toBeVisible();
    await expect(page.getByTestId('pdp-title')).toBeVisible();
    await expect(page.getByTestId('pdp-title')).not.toHaveText('');
    await expect(page.getByTestId('pdp-price')).toBeVisible();
    await expect(page.getByTestId('pdp-price')).not.toHaveText('');

    await assertNoRawApiErrors(page);
  });

  test('invalid slug shows not-found copy @regression', async ({ page, backendReady }) => {
    expect(backendReady.graphql).toBe(true);

    const res = await page.goto('/products/does-not-exist-arc-e2e');
    expect(res?.ok()).toBeTruthy();
    await expect(page.getByTestId('pdp-not-found')).toBeVisible();
    await expect(page.getByTestId('pdp-not-found')).toContainText(/not found/i);
  });

  test('primary CTA uses Arc accent tokens @regression', async ({ page, backendReady }) => {
    expect(backendReady.graphql).toBe(true);

    await page.goto(`/products/${TEST_PRODUCT_SLUG}`);
    await expect(page.getByTestId('add-to-cart')).toBeVisible();
    await assertPrimaryCtaAccent(page, '[data-testid="add-to-cart"]');
  });

  test('body text uses primary token, not pure black @regression', async ({
    page,
    backendReady,
  }) => {
    expect(backendReady.graphql).toBe(true);

    await page.goto(`/products/${TEST_PRODUCT_SLUG}`);
    await assertBodyTextPrimary(page, '[data-testid="pdp-price"]');
  });

  test('focus ring uses accent hue on first tab stop @regression', async ({
    page,
    backendReady,
  }) => {
    expect(backendReady.graphql).toBe(true);

    await page.goto(`/products/${TEST_PRODUCT_SLUG}`);
    await expect(page.getByTestId('add-to-cart')).toBeVisible();
    await assertFocusRingUsesAccent(page, '[data-testid="add-to-cart"]');
  });
});
