/**
 * WPGraphQL product types for @arc/core.
 * These are catalog-layer types returned by WPGraphQL queries.
 * Store API product types (for cart context) live in woo.ts.
 */

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
