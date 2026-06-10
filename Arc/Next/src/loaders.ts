import 'server-only';

// next@16.2.x — stable cache APIs (FORBIDDEN: unstable_cache per Pitfall 2)
import { cacheLife, cacheTag } from 'next/cache';
import {
  getCollection,
  getCollectionProducts,
  getProduct,
  getProducts,
  type WCCollection,
  type WCProduct,
  type WCProductFilter,
  type WCProductList,
} from '@arc/core';
import { arcTag } from './cache-tags.js';
import { createCatalogClient, type CatalogClientConfig } from './client-factory.js';
import { ARC_CACHE_PROFILE } from './isr.js';

export interface ArcLoaderConfig extends CatalogClientConfig {}

// CACHE-P1 (parity audit 2026-06-08): `'use cache'` memoizes RESOLVED values for the
// full cacheLife TTL — including `null`. A product that reads null once (draft, race
// with publish, transient upstream null) would stay invisible until TTL or webhook
// purge. Thrown errors are NOT cached, so the guard throws a sentinel INSIDE the
// cached scope (preventing the cache write) and the uncached wrapper translates it
// back to the public `null` contract. GraphQL/network failures already throw from
// graphql-request and are likewise never cached.
const NULL_RESULT_SENTINEL = 'ARC_NULL_RESULT_DO_NOT_CACHE';

function throwNullResult(): never {
  const error = new Error(NULL_RESULT_SENTINEL);
  error.name = 'ArcNullResultError';
  throw error;
}

function isNullResultError(error: unknown): boolean {
  return error instanceof Error && error.message === NULL_RESULT_SENTINEL;
}

export interface ArcLoaders {
  loadProduct: (slug: string) => Promise<WCProduct | null>;
  loadProducts: (filter?: WCProductFilter) => Promise<WCProductList>;
  loadCollection: (slug: string) => Promise<WCCollection | null>;
  loadCollectionProducts: (
    slug: string,
    filter?: { first?: number; after?: string },
  ) => Promise<WCProductList>;
}

export function createLoaders(config: ArcLoaderConfig): ArcLoaders {
  // IMPORTANT: a `'use cache'` function may only close over SERIALIZABLE values.
  // `config` is plain strings (serializable), so we close over it and build the
  // (non-serializable) GraphQLClient INSIDE each cached function. Closing over a
  // client instance instead throws at build:
  //   "Only plain objects ... can be passed to Client Components".
  async function cachedProduct(slug: string): Promise<WCProduct> {
    'use cache';
    cacheTag(arcTag.product(slug));
    cacheLife(ARC_CACHE_PROFILE.product);
    const product = await getProduct(createCatalogClient(config), slug);
    return product ?? throwNullResult();
  }

  async function loadProduct(slug: string): Promise<WCProduct | null> {
    try {
      return await cachedProduct(slug);
    } catch (error) {
      if (isNullResultError(error)) return null;
      throw error;
    }
  }

  async function loadProducts(filter?: WCProductFilter) {
    'use cache';
    cacheTag(arcTag.productList());
    cacheLife(ARC_CACHE_PROFILE.product);
    return getProducts(createCatalogClient(config), filter);
  }

  async function cachedCollection(slug: string): Promise<WCCollection> {
    'use cache';
    cacheTag(arcTag.collection(slug));
    cacheLife(ARC_CACHE_PROFILE.collection);
    const collection = await getCollection(createCatalogClient(config), slug);
    return collection ?? throwNullResult();
  }

  async function loadCollection(slug: string): Promise<WCCollection | null> {
    try {
      return await cachedCollection(slug);
    } catch (error) {
      if (isNullResultError(error)) return null;
      throw error;
    }
  }

  async function loadCollectionProducts(slug: string, filter?: { first?: number; after?: string }) {
    'use cache';
    cacheTag(arcTag.collection(slug));
    cacheLife(ARC_CACHE_PROFILE.collection);
    return getCollectionProducts(createCatalogClient(config), slug, filter);
  }

  return {
    loadProduct,
    loadProducts,
    loadCollection,
    loadCollectionProducts,
  };
}
