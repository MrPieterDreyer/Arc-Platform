import Link from 'next/link';
import type { WCProduct } from '@arc/core';

export function ProductCardLink({ product }: { product: WCProduct }) {
  return (
    <article
      data-testid="product-card"
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-4)',
        background: 'var(--color-surface)',
      }}
    >
      <Link href={`/products/${product.slug}`} data-testid="product-card-link">
        <h2
          data-testid="product-card-title"
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-body-size)',
            color: 'var(--color-text-primary)',
            margin: 0,
          }}
        >
          {product.name}
        </h2>
        {product.price ? (
          <p
            data-testid="product-card-price"
            style={{
              fontSize: 'var(--text-price-size)',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              margin: 'var(--space-2) 0 0',
            }}
          >
            {product.price}
          </p>
        ) : null}
      </Link>
    </article>
  );
}
