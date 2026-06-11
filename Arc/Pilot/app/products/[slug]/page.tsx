import { getCart } from '@arc-platform/core';
import { createLoaders, createReadOnlyCartClient } from '@arc-platform/next/server';
import Link from 'next/link';
import { Suspense } from 'react';
import { PdpAddToCart } from '../../../components/pdp-add-to-cart';

const { loadProduct } = createLoaders({
  graphqlEndpoint: process.env.ARC_GRAPHQL_ENDPOINT ?? 'http://localhost:8888/graphql',
});

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  // With cacheComponents, dynamic data (params, the product fetch) must be read
  // INSIDE a <Suspense> boundary — so we pass the params promise down rather
  // than awaiting it here at the page level.
  return (
    <Suspense fallback={<p>Loading product…</p>}>
      <ProductDetail params={params} />
    </Suspense>
  );
}

async function loadInitialCart() {
  const wcUrl = process.env.ARC_WC_URL;
  if (!wcUrl) return null;
  try {
    const client = await createReadOnlyCartClient(wcUrl);
    return await getCart(client);
  } catch {
    return null;
  }
}

async function ProductDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let product = null;
  const initialCart = await loadInitialCart();

  try {
    product = await loadProduct(slug);
  } catch {
    product = null;
  }

  if (!product) {
    return (
      <p data-testid="pdp-not-found" style={{ color: 'var(--color-text-muted)' }}>
        Product not found.
      </p>
    );
  }

  return (
    <article data-testid="pdp">
      <p>
        <Link href="/products">← Products</Link>
      </p>
      <h1
        data-testid="pdp-title"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
      >
        {product.name}
      </h1>
      {product.price ? (
        <p
          data-testid="pdp-price"
          style={{
            fontSize: 'var(--text-price-size)',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
          }}
        >
          {product.price}
        </p>
      ) : null}
      <PdpAddToCart productId={product.databaseId} initialCart={initialCart} />
    </article>
  );
}
