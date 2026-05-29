/**
 * WPGraphQL product types for @arc/core.
 * These are catalog-layer types returned by WPGraphQL queries.
 * Store API product types (for cart context) live in woo.ts.
 */

export interface WCProductImage {
  sourceUrl: string;
  altText: string;
}

/** Minimal product fields returned by list/search queries (ProductListFields fragment). */
export interface WCProduct {
  databaseId: number;
  slug: string;
  name: string;
  /** Formatted price string, e.g. "$29.99". */
  price: string | null;
  featuredImage: { node: WCProductImage } | null;
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
