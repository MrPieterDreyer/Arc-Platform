import Link from 'next/link';
import { Suspense } from 'react';
import { createLoaders } from '@arc/next/server';

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

async function ProductDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await loadProduct(slug);

  if (!product) {
    return <p>Product not found.</p>;
  }

  return (
    <article>
      <p>
        <Link href="/">← Home</Link>
      </p>
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
        {product.name}
      </h1>
      {product.price ? <p style={{ color: 'var(--color-text-muted)' }}>{product.price}</p> : null}
      <p style={{ color: 'var(--color-text-muted)' }}>Slug: {slug}</p>
    </article>
  );
}
