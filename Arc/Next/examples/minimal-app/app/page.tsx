import Link from 'next/link';
import { OptimisticCartDemo } from '../components/optimistic-cart-demo';

export default function HomePage() {
  const slug = process.env.TEST_PRODUCT_SLUG ?? 'test-product';

  return (
    <div style={{ display: 'grid', gap: 'var(--space-8)' }}>
      <section>
        <h1 style={{ fontFamily: 'var(--font-display)' }}>@arc/next minimal app</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Demonstrates loaders, cart actions, optimistic UI, and revalidate webhook wiring.
        </p>
        <p style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          <Link href="/products">Browse products →</Link>
          <Link href={`/products/${slug}`}>View sample PDP →</Link>
          <Link href="/weave/e2e-weave-render">Weave CMS page (E2E) →</Link>
        </p>
      </section>
      <OptimisticCartDemo />
    </div>
  );
}
