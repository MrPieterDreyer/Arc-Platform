// ADR-0009 SEC-01 — JWT cookie bridge end-to-end proof.
//
// Proves the full login → order history → access-token refresh → logout cycle
// against wp-graphql-jwt-authentication + the @arc-platform/next cookie bridge.
//
// Credentials: arc_customer / Password123! seeded by Scripts/wp-seed/seed.php.
// Cookies:     arc_auth_token (access, short-lived) + arc_refresh_token (refresh)
//
// This spec is gated on the backend fixture: it skips cleanly when wp-env is absent.

import { expect, test } from '../fixtures/backend';

const ARC_AUTH_TOKEN = 'arc_auth_token';
const ARC_REFRESH_TOKEN = 'arc_refresh_token';

// Seeded by Scripts/wp-seed/seed.php — arc_seed_customer('arc-customer@example.com').
const SEED_USERNAME = 'arc_customer';
const SEED_PASSWORD = 'Password123!';

test.describe('ADR-0009 SEC-01 — JWT cookie bridge @regression', () => {
  // ── Phase a: Login ────────────────────────────────────────────────────────

  test('login sets arc_auth_token and arc_refresh_token HttpOnly cookies @regression', async ({
    page,
    backendReady,
  }) => {
    test.setTimeout(90_000);
    expect(backendReady.graphql).toBe(true);

    await page.goto('/account/login');
    await expect(page.getByTestId('account-login-page')).toBeVisible();

    // Submit the loginFormAction form with seeded credentials.
    await page.getByTestId('login-username').fill(SEED_USERNAME);
    await page.getByTestId('login-password').fill(SEED_PASSWORD);
    await page.getByTestId('login-submit').click();

    // After successful login, loginFormAction redirects to /account.
    await page.waitForURL(/\/account($|\?)/, { timeout: 30_000 });

    const cookies = await page.context().cookies();
    const storefrontUrl = process.env.E2E_STOREFRONT_URL ?? 'http://localhost:3000';
    const isHttps = storefrontUrl.startsWith('https://');

    const authCookie = cookies.find((c) => c.name === ARC_AUTH_TOKEN);
    const refreshCookie = cookies.find((c) => c.name === ARC_REFRESH_TOKEN);

    expect(authCookie, 'arc_auth_token cookie must be set after login').toBeDefined();
    expect(authCookie?.httpOnly).toBe(true);
    // SameSite=None requires Secure; on http localhost both are Lax + insecure.
    if (isHttps) {
      expect(authCookie?.secure).toBe(true);
      expect(authCookie?.sameSite).toBe('None');
    }

    expect(refreshCookie, 'arc_refresh_token cookie must be set after login').toBeDefined();
    expect(refreshCookie?.httpOnly).toBe(true);
  });

  // ── Phase b+c: Order history renders via cookie bridge ────────────────────

  test('orders page renders authenticated list via arc_auth_token (no TEST_JWT_TOKEN) @regression', async ({
    page,
    backendReady,
  }) => {
    test.setTimeout(90_000);
    expect(backendReady.graphql).toBe(true);

    // Log in first to acquire the auth cookies.
    await page.goto('/account/login');
    await expect(page.getByTestId('account-login-page')).toBeVisible();
    await page.getByTestId('login-username').fill(SEED_USERNAME);
    await page.getByTestId('login-password').fill(SEED_PASSWORD);
    await page.getByTestId('login-submit').click();
    await page.waitForURL(/\/account($|\?)/, { timeout: 30_000 });

    // Visit order history — must render the authenticated list driven solely by
    // the arc_auth_token cookie (ARC_E2E_ALLOW_TOKEN_AUTH is set but TEST_JWT_TOKEN
    // is empty, so loadCustomerOrders via the cookie bridge is the only active path).
    await page.goto('/account/orders');
    await expect(page.getByTestId('account-orders-page')).toBeVisible({ timeout: 45_000 });
    await expect(page.getByTestId('account-orders-list')).toBeVisible({ timeout: 45_000 });

    // The unauthenticated gate must NOT appear.
    await expect(page.getByTestId('account-orders-unauthenticated')).not.toBeVisible();
  });

  // ── Phase d: Access-token refresh ─────────────────────────────────────────

  test('orders page still renders after arc_auth_token is cleared (refresh-and-retry) @regression', async ({
    page,
    backendReady,
  }) => {
    test.setTimeout(120_000);
    expect(backendReady.graphql).toBe(true);

    const storefrontUrl = process.env.E2E_STOREFRONT_URL ?? 'http://localhost:3000';
    const cookieUrl = storefrontUrl.endsWith('/') ? storefrontUrl : `${storefrontUrl}/`;
    const isHttps = storefrontUrl.startsWith('https://');

    // Log in to acquire both cookies.
    await page.goto('/account/login');
    await expect(page.getByTestId('account-login-page')).toBeVisible();
    await page.getByTestId('login-username').fill(SEED_USERNAME);
    await page.getByTestId('login-password').fill(SEED_PASSWORD);
    await page.getByTestId('login-submit').click();
    await page.waitForURL(/\/account($|\?)/, { timeout: 30_000 });

    // Confirm both cookies present.
    const cookiesAfterLogin = await page.context().cookies();
    const refreshCookieAfterLogin = cookiesAfterLogin.find((c) => c.name === ARC_REFRESH_TOKEN);
    expect(refreshCookieAfterLogin, 'refresh token must be set').toBeDefined();

    // Simulate access-token expiry: clear only arc_auth_token, keep arc_refresh_token.
    await page.context().clearCookies({ name: ARC_AUTH_TOKEN });

    // Verify the access token is gone but the refresh token remains.
    const cookiesAfterClear = await page.context().cookies();
    expect(cookiesAfterClear.find((c) => c.name === ARC_AUTH_TOKEN)).toBeUndefined();
    expect(cookiesAfterClear.find((c) => c.name === ARC_REFRESH_TOKEN)).toBeDefined();

    // Re-inject the refresh token at the storefront URL so the RSC loader can read it.
    const refreshValue = refreshCookieAfterLogin!.value;
    await page.context().addCookies([
      {
        name: ARC_REFRESH_TOKEN,
        value: refreshValue,
        url: cookieUrl,
        httpOnly: true,
        secure: isHttps,
        sameSite: isHttps ? 'None' : 'Lax',
        path: '/',
      },
    ]);

    // Request /account/orders — the ADR-0009 refresh-and-retry-once loop in
    // @arc-platform/next/server should mint a fresh access token from the refresh
    // token and set a new arc_auth_token cookie before rendering the orders list.
    await page.goto('/account/orders');
    await expect(page.getByTestId('account-orders-page')).toBeVisible({ timeout: 45_000 });

    // Orders must still render — proving the refresh path succeeded.
    await expect
      .poll(
        async () => {
          const ordersEl = page.getByTestId('account-orders-list');
          return ordersEl.isVisible();
        },
        { timeout: 45_000, message: 'account-orders-list should appear after token refresh' },
      )
      .toBe(true);

    // A fresh arc_auth_token should now be set (refresh-and-retry wrote it).
    const cookiesAfterRefresh = await page.context().cookies();
    const newAuthCookie = cookiesAfterRefresh.find((c) => c.name === ARC_AUTH_TOKEN);
    expect(newAuthCookie, 'a new arc_auth_token must be issued after refresh').toBeDefined();
    expect(newAuthCookie?.httpOnly).toBe(true);
  });

  // ── Phase e: Logout ───────────────────────────────────────────────────────

  test('logout clears auth cookies and /account/orders shows unauthenticated gate @regression', async ({
    page,
    backendReady,
  }) => {
    test.setTimeout(90_000);
    expect(backendReady.graphql).toBe(true);

    // Log in.
    await page.goto('/account/login');
    await expect(page.getByTestId('account-login-page')).toBeVisible();
    await page.getByTestId('login-username').fill(SEED_USERNAME);
    await page.getByTestId('login-password').fill(SEED_PASSWORD);
    await page.getByTestId('login-submit').click();
    await page.waitForURL(/\/account($|\?)/, { timeout: 30_000 });

    // Navigate to /account/login to use the logout form (logoutFormAction).
    await page.goto('/account/login');
    await expect(page.getByTestId('account-login-authenticated')).toBeVisible({ timeout: 20_000 });
    await page.getByTestId('logout-submit').click();

    // logoutFormAction redirects to /account/login after clearing cookies.
    await page.waitForURL(/\/account\/login/, { timeout: 30_000 });

    // Both auth cookies must be cleared.
    const cookiesAfterLogout = await page.context().cookies();
    const authAfterLogout = cookiesAfterLogout.find((c) => c.name === ARC_AUTH_TOKEN);
    const refreshAfterLogout = cookiesAfterLogout.find((c) => c.name === ARC_REFRESH_TOKEN);

    expect(authAfterLogout?.value ?? '').toBe('');
    expect(refreshAfterLogout?.value ?? '').toBe('');

    // /account/orders must now show the unauthenticated gate — no authenticated list.
    await page.goto('/account/orders');
    await expect(page.getByTestId('account-orders-page')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('account-orders-unauthenticated')).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId('account-orders-list')).not.toBeVisible();
  });
});
