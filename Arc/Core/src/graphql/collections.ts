// TODO(codegen): Replace inline gql documents with typed __generated__ imports
// after running: pnpm --filter @arc/core codegen
// Expected imports:
//   import { GetCollectionDocument, ListCollectionsDocument, GetCollectionProductsDocument }
//     from './__generated__/graphql.js'
import { gql, GraphQLClient } from 'graphql-request';
import type { WCProduct, WCProductList } from '../types/products.js';

export interface WCCollection {
  databaseId: number;
  slug: string;
  name: string;
  count: number | null;
  image: { sourceUrl: string; altText: string } | null;
  children?: { nodes: WCCollection[] };
  ancestors?: { nodes: WCCollection[] };
}

export interface WCCollectionList {
  nodes: WCCollection[];
}

// ---------------------------------------------------------------------------
// Inline query documents — used until graphql-codegen pipeline runs in v0.2
// ---------------------------------------------------------------------------

const COLLECTION_FIELDS = gql`
  fragment CollectionListFields on ProductCategory {
    databaseId
    slug
    name
    count
    image { sourceUrl altText }
  }
`;

const GET_COLLECTION = gql`
  ${COLLECTION_FIELDS}
  query GetCollection($slug: ID!) {
    productCategory(id: $slug, idType: SLUG) {
      ...CollectionListFields
      children { nodes { ...CollectionListFields } }
      ancestors { nodes { ...CollectionListFields } }
    }
  }
`;

const LIST_COLLECTIONS = gql`
  ${COLLECTION_FIELDS}
  query ListCollections($first: Int = 50) {
    productCategories(first: $first, where: { hideEmpty: true }) {
      nodes { ...CollectionListFields }
    }
  }
`;

const GET_COLLECTION_PRODUCTS = gql`
  query GetCollectionProducts($slug: ID!, $first: Int = 24, $after: String) {
    products(first: $first, after: $after, where: { categoryIn: [$slug] }) {
      pageInfo { hasNextPage endCursor }
      nodes {
        ... on SimpleProduct { databaseId slug name price featuredImage { node { sourceUrl altText } } }
        ... on VariableProduct { databaseId slug name price featuredImage { node { sourceUrl altText } } }
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Fetch a single collection by slug. Returns null if not found. */
export async function getCollection(
  client: GraphQLClient,
  slug: string,
): Promise<WCCollection | null> {
  const data = await client.request<{
    productCategory: WCCollection | null;
  }>(GET_COLLECTION, { slug });
  return data.productCategory ?? null;
}

/** List top-level product categories (hideEmpty: true). */
export async function listCollections(
  client: GraphQLClient,
  first = 50,
): Promise<WCCollectionList> {
  const data = await client.request<{
    productCategories: { nodes: WCCollection[] };
  }>(LIST_COLLECTIONS, { first });
  return { nodes: data.productCategories.nodes };
}

/** Fetch paginated products belonging to a collection slug. */
export async function getCollectionProducts(
  client: GraphQLClient,
  slug: string,
  filter?: { first?: number; after?: string },
): Promise<WCProductList> {
  const data = await client.request<{
    products: { pageInfo: WCProductList['pageInfo']; nodes: WCProduct[] };
  }>(GET_COLLECTION_PRODUCTS, {
    slug,
    first: filter?.first ?? 24,
    after: filter?.after ?? null,
  });
  return { pageInfo: data.products.pageInfo, nodes: data.products.nodes };
}
