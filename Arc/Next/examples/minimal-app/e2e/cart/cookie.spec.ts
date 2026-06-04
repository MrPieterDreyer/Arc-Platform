import { expect, test } from '../fixtures/backend';

const TEST_PRODUCT_SLUG = process.env.TEST_PRODUCT_SLUG ?? 'test-product';
const ARC_CART_TOKEN = 'arc_cart_token';
const CART_SESSION_POLL_MS = 45_000;
const storefrontUrl = process.env.E2E_STOREFRONT_URL ?? 'http://localhost:3000';
const cartCookieSecure = storefrontUrl.startsWith('https://');

test.describe('Wave 3 — arc_cart_token cookie @regression', () => {
  test('sets HttpOnly secure cookie and replays session @regression', async ({
    page,
    backendReady,
  }) => {
    test.setTimeout(120_000);
    expect(backendReady.storeApi).toBe(true);

    await page.goto(`/products/${TEST_PRODUCT_SLUG}`);
    await expect(page.getByTestId('add-to-cart')).toBeVisible();
    await page.getByTestId('add-to-cart').click();

    await expect
      .poll(
        async () =>
          page
            .context()
            .cookies()
            .then((c) => c.find((x) => x.name === ARC_CART_TOKEN)?.value),
        { timeout: CART_SESSION_POLL_MS },
      )
      .not.toBeFalsy();

    const tokenCookie = (await page.context().cookies()).find((c) => c.name === ARC_CART_TOKEN);
    expect(tokenCookie).toBeDefined();
    expect(tokenCookie?.httpOnly).toBe(true);
    expect(tokenCookie?.secure).toBe(cartCookieSecure);
    expect(tokenCookie?.sameSite).toBe(cartCookieSecure ? 'None' : 'Lax');
    expect(tokenCookie?.path).toBe('/');

    const tokenAfterAdd = tokenCookie?.value ?? '';

    await page.goto('/');
    await expect
      .poll(
        async () => {
          const text = (await page.locator('header').getByTestId('cart-badge').textContent()) ?? '';
          const match = text.match(/(\d+)/);
          return match ? Number.parseInt(match[1], 10) : 0;
        },
        { timeout: CART_SESSION_POLL_MS },
      )
      .toBeGreaterThan(0);

    await page.goto('/products');
    const cookiesAfterNav = await page.context().cookies();
    const replayed = cookiesAfterNav.find((c) => c.name === ARC_CART_TOKEN);
    expect(replayed?.value).toBe(tokenAfterAdd);
  });
});
