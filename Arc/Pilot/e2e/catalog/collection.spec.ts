import { expect, test } from '../fixtures/backend';

const TEST_COLLECTION_SLUG = process.env.TEST_COLLECTION_SLUG ?? 'test-collection';
const TEST_PRODUCT_SLUG = process.env.TEST_PRODUCT_SLUG ?? 'test-product';

test.describe('Wave 2 — catalog collection @regression', () => {
  test('collection page lists products in category @regression', async ({ page, backendReady }) => {
    expect(backendReady.graphql).toBe(true);

    const res = await page.goto(`/collections/${TEST_COLLECTION_SLUG}`);
    expect(res?.ok()).toBeTruthy();

    await expect(page.getByTestId('collection-title')).toBeVisible();
    await expect(page.getByTestId('collection-title')).toContainText(/Test Collection/i);
    await expect(page.getByTestId('collection-grid')).toBeVisible();

    const cards = page.getByTestId('product-card');
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThan(0);

    await expect(
      page.getByTestId('product-card-link').filter({ hasText: /Arc Test Simple Product/i }),
    ).toHaveAttribute('href', `/products/${TEST_PRODUCT_SLUG}`);
  });

  test('unknown collection shows not-found copy @regression', async ({ page, backendReady }) => {
    expect(backendReady.graphql).toBe(true);

    const res = await page.goto('/collections/missing-collection-arc-e2e');
    expect(res?.ok()).toBeTruthy();
    await expect(page.getByTestId('collection-not-found')).toBeVisible();
  });
});
