import { expect, test } from '../fixtures/backend';

const TEST_PRODUCT_SLUG = process.env.TEST_PRODUCT_SLUG ?? 'test-product';

test.describe('Wave 9 — visual regression (Chromium) @visual', () => {
  test.use({
    viewport: { width: 1280, height: 720 },
  });

  test('home @visual', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /@arc\/next minimal app/i })).toBeVisible();
    await expect(page).toHaveScreenshot('home.png', { fullPage: true });
  });

  test('PLP @visual', async ({ page, backendReady }) => {
    expect(backendReady.graphql).toBe(true);
    await page.goto('/products');
    await expect(page.getByTestId('plp-grid')).toBeVisible();
    await expect(page).toHaveScreenshot('plp.png', { fullPage: true });
  });

  test('PDP @visual', async ({ page, backendReady }) => {
    expect(backendReady.graphql).toBe(true);
    await page.goto(`/products/${TEST_PRODUCT_SLUG}`);
    await expect(page.getByTestId('add-to-cart')).toBeVisible();
    await expect(page).toHaveScreenshot('pdp.png', { fullPage: true });
  });

  test('checkout empty @visual', async ({ page, backendReady }) => {
    expect(backendReady.storeApi).toBe(true);
    await page.goto('/checkout');
    await expect(page.getByTestId('checkout-page')).toBeVisible();
    await expect(page).toHaveScreenshot('checkout-empty.png', { fullPage: true });
  });

  test('weave input matrix fixture @visual', async ({ page }) => {
    await page.goto('/e2e-fixtures/weave-inputs');
    await expect(page.getByTestId('weave-input-matrix-page')).toBeVisible();
    await expect(page).toHaveScreenshot('weave-input-matrix.png', { fullPage: true });
  });
});
