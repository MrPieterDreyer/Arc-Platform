/**
 * @arc/core — WPGraphQL product types
 *
 * Hand-authored from WPGraphQL for WooCommerce schema.
 * No runtime code — types only.
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

export interface WCProduct {
  databaseId: number;
  slug: string;
  name: string;
  price: string;
  regularPrice: string | null;
  salePrice: string | null;
  onSale: boolean;
  featuredImage: { node: WCProductImage } | null;
  productCategories: { nodes: WCProductCategory[] };
  description?: string;
  shortDescription?: string;
  galleryImages?: { nodes: WCProductImage[] };
  attributes?: { nodes: WCProductAttribute[] };
  variations?: { nodes: WCProductVariation[] };
  related?: {
    nodes: Pick<
      WCProduct,
      'databaseId' | 'slug' | 'name' | 'price' | 'featuredImage'
    >[];
  };
}
