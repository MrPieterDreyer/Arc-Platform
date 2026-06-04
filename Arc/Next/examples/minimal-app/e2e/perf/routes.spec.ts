import {
  assertNavigationWithinBudget,
  DEFAULT_PERF_BUDGETS,
} from '../../../../../../Scripts/e2e-shared/perf';

import { expect, test } from '../fixtures/backend';

const TEST_PRODUCT_SLUG = process.env.TEST_PRODUCT_SLUG ?? 'test-product';

test.describe('Wave 11 — performance budgets @perf', () => {
  test('home navigation timing @perf', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /@arc\/next minimal app/i })).toBeVisible();
    await assertNavigationWithinBudget(page, DEFAULT_PERF_BUDGETS);
  });

  test('PLP navigation timing @perf', async ({ page, backendReady }) => {
    expect(backendReady.graphql).toBe(true);
    await page.goto('/products');
    await expect(page.getByTestId('plp-grid')).toBeVisible();
    await assertNavigationWithinBudget(page, DEFAULT_PERF_BUDGETS);
  });

  test('PDP navigation timing @perf', async ({ page, backendReady }) => {
    expect(backendReady.graphql).toBe(true);
    await page.goto(`/products/${TEST_PRODUCT_SLUG}`);
    await expect(page.getByTestId('add-to-cart')).toBeVisible();
    await assertNavigationWithinBudget(page, DEFAULT_PERF_BUDGETS);
  });
});
