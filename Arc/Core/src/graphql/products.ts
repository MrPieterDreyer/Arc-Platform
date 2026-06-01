// Temporary: inline documents — replace with __generated__ imports after `pnpm codegen` runs
// against a live wp-env instance.
import { type GraphQLClient, gql } from 'graphql-request';
import type { WCProduct, WCProductImage, WCProductVariation } from '../types/products';

// ---------------------------------------------------------------------------
// Inline document definitions (mirrors products.graphql exactly)
// ---------------------------------------------------------------------------

const ProductListFieldsFragment = gql`
  fragment ProductListFields on SimpleProduct {
    databaseId
    slug
    name
    price
    regularPrice
    salePrice
    onSale
    featuredImage { node { sourceUrl altText } }
    productCategories { nodes { slug name } }
  }
`;

const GetProductDocument = gql`
  ${ProductListFieldsFragment}
  fragment ProductDetailFields on SimpleProduct {
    ...ProductListFields
    description
    shortDescription
    galleryImages { nodes { sourceUrl altText } }
    attributes { nodes { name options } }
    related { nodes { ...ProductListFields } }
  }
  fragment VariableProductDetailFields on VariableProduct {
    databaseId slug name price
    variations {
      nodes {
        databaseId price stockStatus
        attributes { nodes { name value } }
        image { sourceUrl altText }
      }
    }
  }
  query GetProduct($slug: ID!) {
    product(id: $slug, idType: SLUG) {
      ... on SimpleProduct { ...ProductDetailFields }
      ... on VariableProduct { ...VariableProductDetailFields }
    }
  }
`;

const GetProductsDocument = gql`
  ${ProductListFieldsFragment}
  query GetProducts($first: Int = 24, $after: String, $where: RootQueryToProductConnectionWhereArgs) {
    products(first: $first, after: $after, where: $where) {
      pageInfo { hasNextPage endCursor }
      nodes {
        ... on SimpleProduct { ...ProductListFields }
        ... on VariableProduct {
          databaseId slug name price
          featuredImage { node { sourceUrl altText } }
        }
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface WCProductFilter {
  search?: string;
  category?: string;
  tag?: string;
  onSale?: boolean;
  orderby?: string;
  order?: 'ASC' | 'DESC';
  first?: number;
  after?: string;
}

export interface WCProductList {
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
  nodes: WCProduct[];
}

// ---------------------------------------------------------------------------
// Internal response shapes (GQL raw)
// ---------------------------------------------------------------------------

interface RawProductResponse {
  product: WCProduct | null;
}

interface RawProductsResponse {
  products: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    nodes: WCProduct[];
  };
}

interface WhereArgs {
  search?: string;
  categoryIn?: string[];
  tagIn?: string[];
  onSale?: boolean;
  orderby?: Array<{ field: string; order: string }>;
}

// ---------------------------------------------------------------------------
// Typed wrapper functions
// ---------------------------------------------------------------------------

/**
 * Fetches a single product by slug.
 * Returns null when no product matches or the product is not published.
 */
export async function getProduct(client: GraphQLClient, slug: string): Promise<WCProduct | null> {
  const data = await client.request<RawProductResponse>(GetProductDocument, {
    slug,
  });
  return data.product ?? null;
}

/**
 * Fetches a paginated list of products with optional filtering.
 * Uses ProductListFields (no variations) — optimised for listing pages.
 */
export async function getProducts(
  client: GraphQLClient,
  filter?: WCProductFilter,
): Promise<WCProductList> {
  const where: WhereArgs = {};
  if (filter?.search) where.search = filter.search;
  if (filter?.category) where.categoryIn = [filter.category];
  if (filter?.tag) where.tagIn = [filter.tag];
  if (filter?.onSale !== undefined) where.onSale = filter.onSale;
  if (filter?.orderby) {
    where.orderby = [{ field: filter.orderby, order: filter.order ?? 'ASC' }];
  }

  const data = await client.request<RawProductsResponse>(GetProductsDocument, {
    first: filter?.first ?? 24,
    after: filter?.after ?? null,
    where: Object.keys(where).length > 0 ? where : undefined,
  });

  return {
    pageInfo: data.products.pageInfo,
    nodes: data.products.nodes,
  };
}

/**
 * Extracts the variation matrix from a product fetched with GetProduct.
 *
 * Returns an empty array for SimpleProduct — call getProduct() first to
 * obtain full variation data (VariableProductDetailFields).
 */
export function getProductVariations(product: WCProduct): WCProductVariation[] {
  const nodes = product.variations?.nodes ?? [];
  // WPGraphQL returns variation `attributes` as `{ nodes: [...] }`; flatten to
  // the array shape WCProductVariation declares.
  return nodes.map((v) => {
    const attrs = v.attributes as unknown as
      | Array<{ name: string; value: string }>
      | { nodes?: Array<{ name: string; value: string }> }
      | undefined;
    return {
      ...v,
      attributes: Array.isArray(attrs) ? attrs : (attrs?.nodes ?? []),
    };
  });
}

// Re-export image type for consumers who need it
export type { WCProductImage };
