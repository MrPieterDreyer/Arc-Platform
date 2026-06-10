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

describe('CACHE-P1 — null/error results are never cached', () => {
  beforeEach(() => {
    getProduct.mockReset().mockResolvedValue({ slug: 'test-slug', name: 'Test' });
    getCollection.mockReset().mockResolvedValue({ slug: 'cat', name: 'Cat' });
  });

  it('loadProduct returns null on a null read (public contract preserved)', async () => {
    getProduct.mockResolvedValueOnce(null);
    const { createLoaders } = await import('../loaders.js');
    const { loadProduct } = createLoaders({ graphqlEndpoint: 'https://cms.test/graphql' });

    await expect(loadProduct('ghost')).resolves.toBeNull();
  });

  it('loadProduct null reads throw INSIDE the cached scope (sentinel prevents cache write)', async () => {
    // The guard works because `'use cache'` never caches a rejected promise: the
    // cached inner fn must reject on null, and only the uncached wrapper maps it
    // back to null. Assert the source keeps the throw inside the 'use cache' fn.
    const fs = await import('node:fs');
    const source = fs.readFileSync(new URL('../loaders.ts', import.meta.url), 'utf8');
    expect(source).toMatch(/'use cache';[\s\S]*?throwNullResult\(\)/);
  });

  it('loadCollection returns null on a null read', async () => {
    getCollection.mockResolvedValueOnce(null);
    const { createLoaders } = await import('../loaders.js');
    const { loadCollection } = createLoaders({ graphqlEndpoint: 'https://cms.test/graphql' });

    await expect(loadCollection('ghost')).resolves.toBeNull();
  });

  it('loadProduct re-throws real upstream errors (network/GraphQL failures stay uncached + visible)', async () => {
    getProduct.mockRejectedValueOnce(new Error('upstream 502'));
    const { createLoaders } = await import('../loaders.js');
    const { loadProduct } = createLoaders({ graphqlEndpoint: 'https://cms.test/graphql' });

    await expect(loadProduct('test-slug')).rejects.toThrow('upstream 502');
  });
});
