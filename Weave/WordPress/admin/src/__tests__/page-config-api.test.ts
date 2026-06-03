/**
 * `page-config.ts` — the @wordpress/api-fetch client for /weave/v1/pages/{slug} (D-08).
 *
 * api-fetch is the alias-stubbed `vi.fn()` default export (see __mocks__/wordpress.ts). These
 * tests pin the exact request contract: GET on load, PUT + JSON body on save, with the slug
 * URL-encoded into the REST path. The auto X-WP-Nonce injection is WP's own concern (api-fetch
 * middleware) — not asserted here.
 */

import apiFetch from '@wordpress/api-fetch';
import type { WeavePageConfig } from '@weave/react';
import { beforeEach, describe, expect, it, type vi } from 'vitest';
import { loadPage, savePage } from '../api/page-config';

const mockApiFetch = apiFetch as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockApiFetch.mockReset();
});

const sampleConfig: WeavePageConfig = {
  schemaVersion: 1,
  slug: 'home',
  sections: [],
  updatedAt: '2026-06-03T00:00:00.000Z',
};

describe('loadPage', () => {
  it('GETs /weave/v1/pages/{slug}', async () => {
    mockApiFetch.mockResolvedValueOnce(sampleConfig);
    const result = await loadPage('home');
    expect(mockApiFetch).toHaveBeenCalledWith({ path: '/weave/v1/pages/home' });
    expect(result).toEqual(sampleConfig);
  });

  it('URL-encodes the slug', async () => {
    mockApiFetch.mockResolvedValueOnce(sampleConfig);
    await loadPage('about us');
    expect(mockApiFetch).toHaveBeenCalledWith({ path: '/weave/v1/pages/about%20us' });
  });
});

describe('savePage', () => {
  it('PUTs the config to /weave/v1/pages/{slug} with method PUT + data', async () => {
    mockApiFetch.mockResolvedValueOnce(sampleConfig);
    await savePage('home', sampleConfig);
    expect(mockApiFetch).toHaveBeenCalledWith({
      path: '/weave/v1/pages/home',
      method: 'PUT',
      data: sampleConfig,
    });
  });

  it('URL-encodes the slug on save', async () => {
    mockApiFetch.mockResolvedValueOnce(sampleConfig);
    await savePage('about us', sampleConfig);
    expect(mockApiFetch).toHaveBeenCalledWith({
      path: '/weave/v1/pages/about%20us',
      method: 'PUT',
      data: sampleConfig,
    });
  });
});
