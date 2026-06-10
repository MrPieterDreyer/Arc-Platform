const fs = require('node:fs');
const path = require('node:path');

const { defineConfig, devices } = require('@playwright/test');

/** Load repo-root `.env.wp-test` when Playwright is started without `dotenv -e` (turbo still wins). */
function loadWpTestEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function stripTrailingSlash(url) {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function getE2eEnv() {
  const wpUrl = stripTrailingSlash(
    process.env.E2E_WP_URL ?? process.env.WP_URL ?? 'http://localhost:8888',
  );
  const storefrontUrl = stripTrailingSlash(
    process.env.E2E_STOREFRONT_URL ?? 'http://localhost:3000',
  );
  const graphqlEndpoint = stripTrailingSlash(
    process.env.ARC_GRAPHQL_ENDPOINT ?? process.env.WP_GRAPHQL_ENDPOINT ?? `${wpUrl}/graphql`,
  );
  return { wpUrl, storefrontUrl, graphqlEndpoint };
}

const configDir = __dirname;
const repoRoot = path.resolve(configDir, '../../../..');
process.env.ARC_E2E_REPO_ROOT = repoRoot;
loadWpTestEnv(path.join(repoRoot, '.env.wp-test'));
const env = getE2eEnv();
const isCi = process.env.CI === 'true' || process.env.CI === '1';
const storefrontUsesHttps = env.storefrontUrl.startsWith('https://');
const cartCookieSecure =
  process.env.ARC_CART_COOKIE_SECURE ?? (storefrontUsesHttps ? 'true' : 'false');
const reporterAgent = path.resolve(repoRoot, 'Scripts/e2e-shared/report-builder.cjs');

/** @type {import('@playwright/test').PlaywrightTestConfig} */
module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  workers: isCi || process.env.CI_WP_ENV ? 1 : undefined,
  reporter: [
    ['list'],
    [
      'html',
      {
        outputFolder: path.join(repoRoot, 'Artifacts/e2e-reports/playwright-report'),
        open: 'never',
      },
    ],
    [reporterAgent],
  ],
  expect: {
    timeout: 45_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
    },
  },
  snapshotPathTemplate: '{testDir}/snapshots/{platform}/{arg}{ext}',
  use: {
    baseURL: env.storefrontUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm run start',
    url: env.storefrontUrl,
    // Fresh server when wp-test env is loaded so WEAVE_WEBHOOK_SECRET matches sign helper.
    reuseExistingServer: !isCi && !process.env.CI_WP_ENV,
    timeout: 120_000,
    cwd: configDir,
    env: {
      ...process.env,
      ARC_CART_COOKIE_SECURE: cartCookieSecure,
      ARC_WC_TIMEOUT_MS: process.env.ARC_WC_TIMEOUT_MS ?? '45000',
      ARC_WC_URL: process.env.ARC_WC_URL ?? env.wpUrl,
      ARC_GRAPHQL_ENDPOINT: process.env.ARC_GRAPHQL_ENDPOINT ?? env.graphqlEndpoint,
      TEST_PRODUCT_SLUG: process.env.TEST_PRODUCT_SLUG ?? 'test-product',
      TEST_PRODUCT_ID: process.env.TEST_PRODUCT_ID ?? '',
      NEXT_PUBLIC_TEST_PRODUCT_ID: process.env.TEST_PRODUCT_ID ?? '1',
      TEST_JWT_TOKEN: process.env.TEST_JWT_TOKEN ?? '',
      E2E_CUSTOMER_JWT_TOKEN: process.env.E2E_CUSTOMER_JWT_TOKEN ?? '',
      // Explicit opt-in for the raw-JWT E2E fallback in load-account-orders.ts —
      // the cookie bridge (ADR-0009) is the real auth path; this never ships enabled.
      ARC_E2E_ALLOW_TOKEN_AUTH: 'true',
      TEST_CUSTOMER_EMAIL: process.env.TEST_CUSTOMER_EMAIL ?? '',
      WEAVE_WEBHOOK_SECRET:
        process.env.WEAVE_WEBHOOK_SECRET && process.env.WEAVE_WEBHOOK_SECRET.length > 0
          ? process.env.WEAVE_WEBHOOK_SECRET
          : 'dev-placeholder-secret-min-32-chars!!',
      WEAVE_WP_BASE_URL: process.env.WEAVE_WP_BASE_URL ?? env.wpUrl,
      WEAVE_WP_APP_USER: process.env.WEAVE_WP_APP_USER ?? process.env.WEAVE_WP_USER ?? 'admin',
      WEAVE_WP_APP_PASSWORD:
        process.env.WEAVE_WP_APP_PASSWORD ?? process.env.WEAVE_WP_PASSWORD ?? 'password',
      WEAVE_WP_USER: process.env.WEAVE_WP_USER ?? process.env.E2E_WP_ADMIN_USER ?? 'admin',
      WEAVE_WP_PASSWORD:
        process.env.WEAVE_WP_PASSWORD ?? process.env.E2E_WP_ADMIN_PASSWORD ?? 'password',
      E2E_WP_ADMIN_USER: process.env.E2E_WP_ADMIN_USER ?? 'admin',
      E2E_WP_ADMIN_PASSWORD: process.env.E2E_WP_ADMIN_PASSWORD ?? 'password',
    },
  },
});
