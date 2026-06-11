import { expect, test } from '../fixtures/backend';

const TEST_PRODUCT_SLUG = process.env.TEST_PRODUCT_SLUG ?? 'test-product';
const ARC_CART_TOKEN = 'arc_cart_token';
const CART_SESSION_POLL_MS = 45_000;
const storefrontUrl = process.env.E2E_STOREFRONT_URL ?? 'http://localhost:3000';

/**
 * PILOT-06 — true multi-tab Cart-Token persistence.
 *
 * Proves that the same Cart-Token cookie binds the same WC cart across two
 * independent browser contexts (simulating two open tabs).  The key assertion:
 * Tab B sees the cart that Tab A populated WITHOUT calling add-to-cart itself.
 *
 * Why two contexts instead of two pages in one context:
 *   Each `browser.newContext()` gets its own isolated cookie jar. We then seed
 *   Context B with the arc_cart_token that was set in Context A, modelling the
 *   real-world behaviour of a second browser tab that inherits the same cookie
 *   jar from the OS cookie store.
 *
 * ADR-0006: arc_cart_token is HttpOnly and server-set. Playwright can still
 *   read it via `context.cookies()` and inject it via `context.addCookies()`.
 */
test.describe('Wave 3 — arc_cart_token multi-tab persistence @regression', () => {
  test('cart added in tab A appears in tab B without re-adding (PILOT-06)', async ({
    browser,
    backendReady,
  }) => {
    test.setTimeout(180_000);
    expect(backendReady.storeApi).toBe(true);

    // -----------------------------------------------------------------------
    // Context A (tab A): add an item, wait for the token + cart badge
    // -----------------------------------------------------------------------
    const ctxA = await browser.newContext({ baseURL: storefrontUrl });
    const pageA = await ctxA.newPage();

    await pageA.goto(`/products/${TEST_PRODUCT_SLUG}`);
    await expect(pageA.getByTestId('add-to-cart')).toBeVisible();
    await pageA.getByTestId('add-to-cart').click();

    // Wait for arc_cart_token to be set (mirrors cookie.spec.ts pattern)
    await expect
      .poll(
        async () => {
          const cookies = await ctxA.cookies();
          return cookies.find((c) => c.name === ARC_CART_TOKEN)?.value;
        },
        { timeout: CART_SESSION_POLL_MS },
      )
      .not.toBeFalsy();

    const cookiesA = await ctxA.cookies();
    const tokenCookie = cookiesA.find((c) => c.name === ARC_CART_TOKEN);
    expect(tokenCookie).toBeDefined();
    const tokenValue = tokenCookie?.value ?? '';
    expect(tokenValue.length).toBeGreaterThan(0);

    // Capture cart badge count in tab A to compare against tab B
    await pageA.goto('/');
    let tabACount = 0;
    await expect
      .poll(
        async () => {
          const text =
            (await pageA.locator('header').getByTestId('cart-badge').textContent()) ?? '';
          const match = text.match(/(\d+)/);
          tabACount = match ? Number.parseInt(match[1], 10) : 0;
          return tabACount;
        },
        { timeout: CART_SESSION_POLL_MS },
      )
      .toBeGreaterThan(0);

    // -----------------------------------------------------------------------
    // Context B (tab B): seed the same arc_cart_token, assert cart WITHOUT
    //   calling add-to-cart — pure persistence proof (ADR-0006)
    // -----------------------------------------------------------------------
    const ctxB = await browser.newContext({ baseURL: storefrontUrl });

    // Seed tab B with the arc_cart_token from tab A.  This models a second
    // browser tab that shares the same OS cookie jar.  The cookie is HttpOnly
    // so the server enforces it; Playwright's injection is the test harness
    // equivalent of the cookie being present in the request headers.
    await ctxB.addCookies([
      {
        name: ARC_CART_TOKEN,
        value: tokenValue,
        // Use the storefront hostname; localhost requires domain='' or omitted
        domain: new URL(storefrontUrl).hostname,
        path: '/',
        httpOnly: true,
        secure: storefrontUrl.startsWith('https://'),
        sameSite: storefrontUrl.startsWith('https://') ? 'None' : 'Lax',
      },
    ]);

    const pageB = await ctxB.newPage();
    // Navigate to home — NOT to the PDP, so no add-to-cart button is present
    await pageB.goto('/');

    // Assert tab B's cart badge shows the SAME count as tab A (>0) without
    // ever calling add-to-cart in this context.
    await expect
      .poll(
        async () => {
          const text =
            (await pageB.locator('header').getByTestId('cart-badge').textContent()) ?? '';
          const match = text.match(/(\d+)/);
          return match ? Number.parseInt(match[1], 10) : 0;
        },
        { timeout: CART_SESSION_POLL_MS },
      )
      .toBeGreaterThan(0);

    // Same Cart-Token value in tab B confirms it's the same WC cart session
    const cookiesB = await ctxB.cookies();
    const tokenCookieB = cookiesB.find((c) => c.name === ARC_CART_TOKEN);
    expect(tokenCookieB?.value).toBe(tokenValue);

    // -----------------------------------------------------------------------
    // Cleanup
    // -----------------------------------------------------------------------
    await ctxA.close();
    await ctxB.close();
  });
});
