/**
 * Apply staging URL overrides when `E2E_ENV=staging`.
 *
 * Maps `E2E_STAGING_*` secrets onto the canonical env vars consumed by
 * `getE2eEnv()` and Playwright webServer config. Safe to call multiple times.
 */

function assignIfUnset(target: string, value: string | undefined): void {
  if (!value || value.length === 0) return;
  if (!process.env[target] || process.env[target]?.length === 0) {
    process.env[target] = value;
  }
}

/** Copy staging secrets onto canonical E2E env vars when running against staging. */
export function applyStagingEnvOverrides(): void {
  if (process.env.E2E_ENV !== 'staging') {
    return;
  }

  const stagingStorefront = process.env.E2E_STAGING_STOREFRONT_URL;
  const stagingWp = process.env.E2E_STAGING_WP_URL;
  const stagingWpPassword = process.env.E2E_STAGING_WP_APP_PASSWORD;

  assignIfUnset('E2E_STOREFRONT_URL', stagingStorefront);
  assignIfUnset('E2E_WP_URL', stagingWp);
  assignIfUnset('WP_URL', stagingWp);
  assignIfUnset('ARC_WC_URL', stagingWp);
  assignIfUnset('WEAVE_WP_BASE_URL', stagingWp);

  if (stagingWp && stagingWp.length > 0) {
    assignIfUnset('ARC_GRAPHQL_ENDPOINT', `${stagingWp.replace(/\/+$/, '')}/graphql`);
    assignIfUnset('WP_GRAPHQL_ENDPOINT', `${stagingWp.replace(/\/+$/, '')}/graphql`);
  }

  assignIfUnset('WEAVE_WP_APP_PASSWORD', stagingWpPassword);
}
