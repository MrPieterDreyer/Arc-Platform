import { Suspense } from 'react';
import Link from 'next/link';
import { connection } from 'next/server';
import { createLoaders } from '@arc/next/server';
import { ProductCardLink } from '../../components/product-card-link';

const { loadProducts } = createLoaders({
  graphqlEndpoint: process.env.ARC_GRAPHQL_ENDPOINT ?? 'http://localhost:8888/graphql',
});

export default function ProductsPage() {
  return (
    <Suspense fallback={<p>Loading products…</p>}>
      <ProductList />
    </Suspense>
  );
}

async function ProductList() {
  await connection();
  const { nodes } = await loadProducts({ first: 24 });

  return (
    <>
      <p>
        <Link href="/">← Home</Link>
      </p>
      <h1
        data-testid="plp-title"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
      >
        Products
      </h1>
      <div
        data-testid="plp-grid"
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
