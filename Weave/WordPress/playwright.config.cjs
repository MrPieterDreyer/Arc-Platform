const path = require('node:path');

const { defineConfig, devices } = require('@playwright/test');

const configDir = __dirname;
const repoRoot = path.resolve(configDir, '../..');
process.env.ARC_E2E_REPO_ROOT = repoRoot;

const wpAdminUrl =
  process.env.E2E_WP_ADMIN_URL ??
  `${(process.env.E2E_WP_URL ?? process.env.WP_URL ?? 'http://localhost:8888').replace(/\/+$/, '')}/wp-admin/`;

/** @type {import('@playwright/test').PlaywrightTestConfig} */
module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list']],
  use: {
    baseURL: wpAdminUrl,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
