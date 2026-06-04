import Link from 'next/link';
import { Suspense } from 'react';
import { createLoaders } from '@arc/next/server';
import { ProductCardLink } from '../../../components/product-card-link';

const { loadCollection, loadCollectionProducts } = createLoaders({
  graphqlEndpoint: process.env.ARC_GRAPHQL_ENDPOINT ?? 'http://localhost:8888/graphql',
});

export default function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<p>Loading collection…</p>}>
      <CollectionDetail params={params} />
    </Suspense>
  );
}

async function CollectionDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const collection = await loadCollection(slug);

  if (!collection) {
    return <p data-testid="collection-not-found">Collection not found.</p>;
  }

  const { nodes } = await loadCollectionProducts(slug, { first: 24 });

  return (
    <>
      <p>
        <Link href="/products">← Products</Link>
      </p>
      <h1
        data-testid="collection-title"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
      >
        {collection.name}
      </h1>
      <div
        data-testid="collection-grid"
        style={{
          display: 'grid',
          gap: 'var(--space-4)',
          gridTemplateColumns: 'repeat(auto-fill, minmax(14rem, 1fr))',
          marginTop: 'var(--space-4)',
        }}
      >
        {nodes.map((product) => (
          <ProductCardLink key={product.databaseId} product={product} />
        ))}
      </div>
    </>
  );
}
