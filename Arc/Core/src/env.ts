/**
 * Arc startup environment validator (Wave-2).
 *
 * validateArcEnv() checks every required Arc env var at startup and throws a
 * single, clear error listing ALL missing or malformed values — never a partial
 * failure that leaves the app half-configured.
 *
 * Required vars:
 *   ARC_GRAPHQL_ENDPOINT  — WPGraphQL URL (must be a valid URL)
 *   ARC_WC_URL            — WooCommerce store root URL (must be a valid URL)
 *
 * Optional vars (read by loaders/proxy but not hard requirements):
 *   ARC_CART_COOKIE_SECURE, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
 *   STRIPE_WEBHOOK_SECRET, WEAVE_WP_*
 *
 * Usage — call once at Pilot startup (e.g. a server-only boot module):
 *
 *   import { validateArcEnv } from '@arc-platform/core';
 *   validateArcEnv();           // uses process.env
 *   validateArcEnv(process.env) // explicit injection (tests)
 */

/** Minimal env shape this validator reads. */
type ArcEnvInput = Record<string, string | undefined>;

/** The set of required Arc env var names. */
const REQUIRED_ARC_VARS = ['ARC_GRAPHQL_ENDPOINT', 'ARC_WC_URL'] as const;
type RequiredArcVar = (typeof REQUIRED_ARC_VARS)[number];

/** Returns true if the string is a valid absolute URL. */
function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validates required Arc environment variables.
 *
 * @param env - env record to validate (defaults to process.env).
 *              Injected for testability.
 * @throws {Error} with a single message listing every missing / malformed var.
 */
export function validateArcEnv(env: ArcEnvInput = process.env): void {
  const errors: string[] = [];

  for (const key of REQUIRED_ARC_VARS as readonly RequiredArcVar[]) {
    const value = env[key];

    if (!value || value.trim() === '') {
      errors.push(`  - ${key} is missing or empty`);
      continue;
    }

    if (!isValidUrl(value)) {
      errors.push(`  - ${key} is not a valid http/https URL (got: "${value}")`);
    }
  }

  if (errors.length > 0) {
    throw new Error(
      [
        'Arc startup check failed — required environment variables are missing or invalid:',
        ...errors,
        '',
        'Set these variables in your .env.local (local dev) or CI/hosting env secrets.',
        'See Arc/Pilot/.env.example for the full list.',
      ].join('\n'),
    );
  }
}
