import Link from 'next/link';
import { Suspense } from 'react';
import { createLoaders } from '@arc/next/server';
import { ProductCardLink } from '../../components/product-card-link';

const { loadProducts } = createLoaders({
  graphqlEndpoint: process.env.ARC_GRAPHQL_ENDPOINT ?? 'http://localhost:8888/graphql',
});

export default function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  return (
    <Suspense fallback={<p>Searching…</p>}>
      <SearchResults searchParams={searchParams} />
    </Suspense>
  );
}

async function SearchResults({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = q?.trim() ?? '';

  if (!query) {
    return (
      <>
        <p>
          <Link href="/products">← Products</Link>
        </p>
        <h1
          data-testid="search-title"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        >
          Search
        </h1>
        <p data-testid="search-empty-query" style={{ color: 'var(--color-text-muted)' }}>
          Enter a search term using <code>?q=</code> in the URL.
        </p>
      </>
    );
  }

  const { nodes } = await loadProducts({ search: query, first: 24 });

  return (
    <>
      <p>
        <Link href="/products">← Products</Link>
      </p>
      <h1
        data-testid="search-title"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
      >
        Search: {query}
      </h1>
      <div
        data-testid="search-results"
        style={{
          display: 'grid',
          gap: 'var(--space-4)',
          gridTemplateColumns: 'repeat(auto-fill, minmax(14rem, 1fr))',
          marginTop: 'var(--space-4)',
        }}
      >
        {nodes.length === 0 ? (
          <p data-testid="search-no-results" style={{ color: 'var(--color-text-muted)' }}>
            No products matched your search.
          </p>
        ) : (
          nodes.map((product) => <ProductCardLink key={product.databaseId} product={product} />)
        )}
      </div>
    </>
  );
}
