import { hasCustomerJwtEnv } from '../../../../Scripts/e2e-shared/account-auth';
import { assertNoRawApiErrors } from '../../../../Scripts/e2e-shared/design-assertions';

import { expect, test } from '../fixtures/backend';

test.describe('Wave 7 — account orders (JWT) @regression', () => {
  // biome-ignore lint/correctness/noEmptyPattern: Playwright requires fixture object destructuring
  test.beforeEach(({}, testInfo) => {
    if (!hasCustomerJwtEnv()) {
      testInfo.skip(
        true,
        'Set TEST_JWT_TOKEN or E2E_CUSTOMER_JWT_TOKEN (wp-graphql-jwt-authentication — ADR-0009; see Scripts/e2e-shared/README.md).',
      );
    }
  });

  test('/account/orders lists seeded customer orders @regression', async ({
    page,
    backendReady,
  }) => {
    expect(backendReady.graphql).toBe(true);

    await page.goto('/account/orders');
    await expect(page.getByTestId('account-orders-page')).toBeVisible();
    await expect(page.getByTestId('account-orders-list')).toBeVisible();
    await assertNoRawApiErrors(page);
  });
});
