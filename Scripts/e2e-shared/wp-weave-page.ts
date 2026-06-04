/**
 * Seed Weave page configs over weave/v1 REST (Wave 4 E2E).
 */

import type { APIRequestContext } from '@playwright/test';

import type { E2eEnv } from './e2e-env';

/** Slug used by minimal-app Wave 4 render spec. */
export const E2E_WEAVE_PAGE_SLUG = 'e2e-weave-render';

export const E2E_WEAVE_HEADING_TEXT = 'E2E Weave heading marker';
export const E2E_WEAVE_BODY_TEXT = 'E2E weave body marker';

export interface WeavePageConfigBody {
  schemaVersion: number;
  slug: string;
  sections: Array<{
    id: string;
    type: string;
    data: Record<string, unknown>;
    version: number;
  }>;
  updatedAt: string;
}

export { buildWeaveInputMatrixPageConfig, E2E_WEAVE_INPUT_MATRIX_SLUG } from './weave-input-matrix';

export function buildE2eWeavePageConfig(slug: string = E2E_WEAVE_PAGE_SLUG): WeavePageConfigBody {
  return {
    schemaVersion: 1,
    slug,
    sections: [
      {
        id: 'e2e1111-1111-4111-8111-111111111111',
        type: 'e2e-heading',
        data: { text: E2E_WEAVE_HEADING_TEXT },
        version: 1,
      },
      {
        id: 'e2e2222-2222-4222-8222-222222222222',
        type: 'e2e-body',
        data: { body: E2E_WEAVE_BODY_TEXT },
        version: 1,
      },
    ],
    updatedAt: '2000-01-01T00:00:00+00:00',
  };
}

function wpAdminAuth(): { user: string; password: string } {
  const user =
    process.env.WEAVE_WP_APP_USER ??
    process.env.WEAVE_WP_USER ??
    process.env.E2E_WP_ADMIN_USER ??
    'admin';
  const password =
    process.env.WEAVE_WP_APP_PASSWORD ??
    process.env.WEAVE_WP_PASSWORD ??
    process.env.E2E_WP_ADMIN_PASSWORD ??
    'password';
  return { user, password };
}

function basicAuthHeader(user: string, password: string): string {
  return `Basic ${Buffer.from(`${user}:${password}`, 'utf8').toString('base64')}`;
}

/**
 * PUT a page config via weave/v1. Requires wp-env admin credentials.
 */
export async function putWeavePageConfig(
  request: APIRequestContext,
  env: E2eEnv,
  slug: string,
  config: WeavePageConfigBody,
): Promise<void> {
  const { user, password } = wpAdminAuth();
  const res = await request.put(`${env.wpUrl}/wp-json/weave/v1/pages/${encodeURIComponent(slug)}`, {
    headers: {
      Authorization: basicAuthHeader(user, password),
      'Content-Type': 'application/json',
    },
    data: config,
  });

  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`PUT weave page ${slug} failed (${res.status()}): ${body.slice(0, 400)}`);
  }
}
