import { expect, test } from '../fixtures/backend';

const TEST_PRODUCT_SLUG = process.env.TEST_PRODUCT_SLUG ?? 'test-product';

test.describe('Wave 2 — catalog PLP @regression', () => {
  test('product grid lists seeded products with PDP links @regression', async ({
    page,
    backendReady,
  }) => {
    expect(backendReady.graphql).toBe(true);

    const res = await page.goto('/products');
    expect(res?.ok()).toBeTruthy();

    await expect(page.getByTestId('plp-title')).toBeVisible();
    await expect(page.getByTestId('plp-grid')).toBeVisible();

    const cards = page.getByTestId('product-card');
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThan(0);

    const seededCard = page.getByTestId('product-card').filter({
      has: page.getByTestId('product-card-title').filter({ hasText: /Arc Test Simple Product/i }),
    });
    await expect(seededCard.first()).toBeVisible();

    const seededLink = seededCard.first().getByTestId('product-card-link');
    await expect(seededLink).toHaveAttribute('href', `/products/${TEST_PRODUCT_SLUG}`);

    await seededLink.click();
    await expect(page).toHaveURL(new RegExp(`/products/${TEST_PRODUCT_SLUG}$`));
    await expect(page.getByTestId('pdp-title')).toBeVisible();
  });
});
