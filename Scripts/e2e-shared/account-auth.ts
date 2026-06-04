/**
 * Wave 7 — customer auth env gate for account E2E.
 * Full login is deferred per ADR-0009; JWT enables order-history tests only.
 */

/** JWT for WPGraphQL `customer` queries (TEST_JWT_TOKEN or E2E_CUSTOMER_JWT_TOKEN). */
export function getCustomerJwtFromEnv(): string | null {
  const token =
    process.env.E2E_CUSTOMER_JWT_TOKEN?.trim() || process.env.TEST_JWT_TOKEN?.trim() || '';
  return token.length > 0 ? token : null;
}

export function hasCustomerJwtEnv(): boolean {
  return getCustomerJwtFromEnv() !== null;
}
