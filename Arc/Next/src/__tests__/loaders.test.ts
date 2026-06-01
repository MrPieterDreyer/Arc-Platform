import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cacheTagMock, revalidateTagMock } from './__mocks__/next-cache.js';

vi.mock('next/cache', () => ({
  cacheTag: cacheTagMock,
  cacheLife: vi.fn(),
  revalidateTag: revalidateTagMock,
}));

const getProduct = vi.fn().mockResolvedValue({ slug: 'test-slug', name: 'Test' });
const getProducts = vi.fn().mockResolvedValue({ nodes: [], pageInfo: { hasNextPage: false } });
const getCollection = vi.fn().mockResolvedValue({ slug: 'cat', name: 'Cat' });
const getCollectionProducts = vi
  .fn()
  .mockResolvedValue({ nodes: [], pageInfo: { hasNextPage: false } });

vi.mock('@arc/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@arc/core')>();
  return {
    ...actual,
    getProduct,
    getProducts,
    getCollection,
    getCollectionProducts,
  };
});

describe('ARC-NEXT-01 — cached catalog loaders', () => {
  beforeEach(() => {
    cacheTagMock.mockClear();
    getProduct.mockClear();
  });

  it('loadProduct tags arc:product:{slug} and calls getProduct', async () => {
    const { createLoaders } = await import('../loaders.js');
    const { loadProduct } = createLoaders({ graphqlEndpoint: 'https://cms.test/graphql' });
    const product = await loadProduct('test-slug');

    expect(product).toEqual({ slug: 'test-slug', name: 'Test' });
    expect(cacheTagMock).toHaveBeenCalledWith('arc:product:test-slug');
    expect(getProduct).toHaveBeenCalled();
  });

  it('loaders module does not import next/headers', async () => {
    const fs = await import('node:fs');
    const source = fs.readFileSync(new URL('../loaders.ts', import.meta.url), 'utf8');
    expect(source).not.toMatch(/next\/headers/);
  });
});
