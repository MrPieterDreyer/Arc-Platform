import { expect, test } from '../fixtures/backend';

test.describe('Wave 2 — catalog search @regression', () => {
  test('search route returns seeded product for query @regression', async ({
    page,
    backendReady,
  }) => {
    expect(backendReady.graphql).toBe(true);

    const res = await page.goto('/search?q=Arc+Test+Simple');
    expect(res?.ok()).toBeTruthy();

    await expect(page.getByTestId('search-title')).toBeVisible();
    await expect(page.getByTestId('search-results')).toBeVisible();
    await expect(page.getByTestId('product-card').first()).toBeVisible();
    await expect(page.getByTestId('product-card-title').first()).toContainText(
      /Arc Test Simple Product/i,
    );
  });

  test('search with no matches shows empty state @regression', async ({ page, backendReady }) => {
    expect(backendReady.graphql).toBe(true);

    const res = await page.goto('/search?q=zzzz-no-match-arc-e2e');
    expect(res?.ok()).toBeTruthy();
    await expect(page.getByTestId('search-no-results')).toBeVisible();
  });
});
