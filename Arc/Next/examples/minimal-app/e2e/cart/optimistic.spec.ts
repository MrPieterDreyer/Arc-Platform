import type { Page } from '@playwright/test';

import { assertNoRawApiErrors } from '../../../../../../Scripts/e2e-shared/design-assertions';

import { expect, test } from '../fixtures/backend';

const TEST_PRODUCT_SLUG = process.env.TEST_PRODUCT_SLUG ?? 'test-product';
const ARC_CART_TOKEN = 'arc_cart_token';
const CART_SESSION_POLL_MS = 45_000;

function headerCartBadge(page: Page) {
  return page.locator('header').getByTestId('cart-badge');
}

test.describe('Wave 3 — cart optimistic UI @regression', () => {
  test('PDP add-to-cart updates count and line items @regression', async ({
    page,
    backendReady,
  }) => {
    test.setTimeout(120_000);
    expect(backendReady.storeApi).toBe(true);

    await page.goto(`/products/${TEST_PRODUCT_SLUG}`);
    await expect(page.getByTestId('pdp')).toBeVisible();
    await expect(page.getByTestId('add-to-cart')).toBeVisible();

    const pdpBadge = page.getByTestId('pdp').getByTestId('cart-badge');
    const before = Number.parseInt((await pdpBadge.textContent())?.replace(/\D/g, '') || '0', 10);

    await page.getByTestId('add-to-cart').click();
    await expect(pdpBadge)
      .toContainText('Updating cart', { timeout: 15_000 })
      .catch(() => {
        /* pending label may be too fast to catch */
      });

    await expect
      .poll(
        async () => {
          const text = (await pdpBadge.textContent()) ?? '';
          const match = text.match(/(\d+)/);
          return match ? Number.parseInt(match[1], 10) : 0;
        },
        { timeout: CART_SESSION_POLL_MS },
      )
      .toBeGreaterThan(before);

    await expect(page.getByTestId('cart-line-items')).toBeVisible();
    await expect(page.getByTestId('cart-line-item').first()).toBeVisible();
    await expect(headerCartBadge(page)).not.toHaveText(/Cart \(0\)/);

    const cookies = await page.context().cookies();
    expect(cookies.some((c) => c.name === ARC_CART_TOKEN && c.value.length > 0)).toBe(true);

    await assertNoRawApiErrors(page);
  });

  test('optimistic count rolls back on forced failure @regression', async ({
    page,
    backendReady,
  }) => {
    expect(backendReady.storeApi).toBe(true);

    await page.goto('/');
    const badge = page
      .locator('section[aria-labelledby="cart-demo-title"]')
      .getByTestId('cart-badge');
    const before = Number.parseInt((await badge.textContent())?.replace(/\D/g, '') || '0', 10);

    await page.getByTestId('add-to-cart-fail').click();

    await expect(badge).toContainText(`Cart items: ${before}`, { timeout: 15_000 });
    await expect(page.getByTestId('cart-error')).toBeVisible();
    await expect(page.getByTestId('cart-error')).toContainText(/cart/i);
    await expect(page.getByTestId('cart-error')).toContainText(/try again/i);
    await assertNoRawApiErrors(page);
  });
});
