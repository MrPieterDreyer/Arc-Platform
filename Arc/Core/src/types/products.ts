/**
 * WPGraphQL product types for @arc/core.
 * These are catalog-layer types returned by WPGraphQL queries.
 *
 * NOTE: Two product image shapes co-exist in this file:
 *   - WCProductImage (GQL): uses sourceUrl + altText (WPGraphQL field names)
 *   - WCStoreProductImage (Store API): uses src + alt (REST field names)
 * Both are needed: GQL for catalog, Store API for cart cross_sells and
 * related products surfaced by the /cart endpoint.
 */

// ---------------------------------------------------------------------------
// WPGraphQL catalog types (sourceUrl / altText shape)
// ---------------------------------------------------------------------------

export interface WCProductImage {
  sourceUrl: string;
  altText: string;
}

export interface WCProductCategory {
  slug: string;
  name: string;
}

export interface WCProductAttribute {
  name: string;
  options?: string[];
}

export interface WCProductVariation {
  databaseId: number;
  price: string;
  stockStatus: string;
  attributes: Array<{ name: string; value: string }>;
  image: WCProductImage | null;
}

/** Minimal product fields returned by list/search queries (ProductListFields fragment). */
export interface WCProduct {
  databaseId: number;
  slug: string;
  name: string;
  /** Formatted price string, e.g. "$29.99". */
  price: string | null;
  featuredImage: { node: WCProductImage } | null;
  categories?: { nodes: WCProductCategory[] };
  attributes?: { nodes: WCProductAttribute[] };
  variations?: { nodes: WCProductVariation[] };
}

/** Pagination cursor information returned by WPGraphQL connections. */
export interface WCPageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

/** Paginated list of products — shared by catalog and search. */
export interface WCProductList {
  pageInfo: WCPageInfo;
  nodes: WCProduct[];
}

// ---------------------------------------------------------------------------
// Store API product types (src / alt shape — cart cross_sells, related products)
// ---------------------------------------------------------------------------

/**
 * Product image as returned by the WC Store API (/cart, /products endpoints).
 * Note: GQL uses WCProductImage { sourceUrl, altText }; this is the REST shape.
 */
export interface WCStoreProductImage {
  id: number;
  src: string;
  name: string;
  alt: string;
}

/** Product category as returned by the WC Store API (id + name + slug). */
export interface WCStoreProductCategory {
  id: number;
  name: string;
  slug: string;
}

/** Product tag as returned by the WC Store API. */
export interface WCProductTag {
  id: number;
  name: string;
  slug: string;
}

/** Product attribute as returned by the WC Store API (options array, not nodes). */
export interface WCStoreProductAttribute {
  id: number;
  name: string;
  position: number;
  visible: boolean;
  variation: boolean;
  options: string[];
}

/** Product variation as returned by the WC Store API. */
export interface WCStoreProductVariation {
  id: number;
  price: string;
  regular_price: string;
  sale_price: string | null;
  stock_status: string;
  stock_quantity: number | null;
  attributes: Array<{ id: number; name: string; option: string }>;
  image: WCStoreProductImage | null;
}

/**
 * Product as returned by the WC Store API (/products and cart cross_sells).
 * This is the REST API shape, distinct from the WPGraphQL WCProduct shape above.
 * Use WCProduct (GQL) for catalog pages; use WCStoreProduct for cart context.
 */
export interface WCStoreProduct {
  id: number;
  slug: string;
  name: string;
  permalink: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string | null;
  on_sale: boolean;
  status: string;
  featured: boolean;
  catalog_visibility: string;
  description: string;
  short_description: string;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  stock_quantity: number | null;
  manage_stock: boolean | 'parent';
  images: WCStoreProductImage[];
  categories: WCStoreProductCategory[];
  tags: WCProductTag[];
  attributes: WCStoreProductAttribute[];
  type: 'simple' | 'variable' | 'grouped' | 'external';
  variations: number[];
}
