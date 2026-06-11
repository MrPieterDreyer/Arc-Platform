import { hasCustomerJwtEnv } from '../../../../Scripts/e2e-shared/account-auth';
import { assertNoRawApiErrors } from '../../../../Scripts/e2e-shared/design-assertions';

import { expect, test } from '../fixtures/backend';

test.describe('Wave 7 — account session (Store API) @regression', () => {
  test('/account renders session scope copy @regression', async ({ page, backendReady }) => {
    test.setTimeout(60_000);
    expect(backendReady.storeApi).toBe(true);
    await page.goto('/account');
    await expect(page.getByTestId('account-page')).toBeVisible();
    await expect(page.getByRole('link', { name: 'order history' })).toBeVisible();
    await expect(page.getByTestId('account-email')).toContainText('billing email');
    await assertNoRawApiErrors(page);
  });

  test('/account/orders shows JWT gate when token unset @regression', async ({
    page,
    backendReady,
  }) => {
    test.skip(hasCustomerJwtEnv(), 'JWT configured — covered by orders.spec.ts');
    expect(backendReady.graphql).toBe(true);

    await page.goto('/account/orders');
    await expect(page.getByTestId('account-orders-page')).toBeVisible();
    await expect(page.getByTestId('account-orders-unauthenticated')).toBeVisible();
    await assertNoRawApiErrors(page);
  });
});
