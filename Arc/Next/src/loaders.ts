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
  async function loadProduct(slug: string) {
    'use cache';
    cacheTag(arcTag.product(slug));
    cacheLife(ARC_CACHE_PROFILE.product);
    return getProduct(createCatalogClient(config), slug);
  }

  async function loadProducts(filter?: WCProductFilter) {
    'use cache';
    cacheTag(arcTag.productList());
    cacheLife(ARC_CACHE_PROFILE.product);
    return getProducts(createCatalogClient(config), filter);
  }

  async function loadCollection(slug: string) {
    'use cache';
    cacheTag(arcTag.collection(slug));
    cacheLife(ARC_CACHE_PROFILE.collection);
    return getCollection(createCatalogClient(config), slug);
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
