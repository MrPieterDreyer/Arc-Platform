import { gql, GraphQLClient } from 'graphql-request';
import type { WCProduct, WCProductList } from '../types/products.js';

export interface WCSearchFilter {
  first?: number;
  after?: string;
}

// Inline query document — used until graphql-codegen pipeline runs in v0.2.
// Depends on ProductListFields fragment from products.graphql when codegen is active.
const SEARCH_PRODUCTS = gql`
  query SearchProducts($search: String!, $first: Int = 24, $after: String) {
    products(first: $first, after: $after, where: { search: $search, status: "publish" }) {
      pageInfo { hasNextPage endCursor }
      nodes {
        ... on SimpleProduct { databaseId slug name price featuredImage { node { sourceUrl altText } } }
        ... on VariableProduct { databaseId slug name price featuredImage { node { sourceUrl altText } } }
      }
    }
  }
`;

/**
 * Full-text product search via WPGraphQL.
 *
 * Uses WPGraphQL full-text search. For faceted search with Algolia/Typesense,
 * use a v2 search adapter.
 */
export async function searchProducts(
  client: GraphQLClient,
  query: string,
  filter?: WCSearchFilter,
): Promise<WCProductList> {
  const data = await client.request<{
    products: { pageInfo: WCProductList['pageInfo']; nodes: WCProduct[] };
  }>(SEARCH_PRODUCTS, {
    search: query,
    first: filter?.first ?? 24,
    after: filter?.after ?? null,
  });
  return { pageInfo: data.products.pageInfo, nodes: data.products.nodes };
}
