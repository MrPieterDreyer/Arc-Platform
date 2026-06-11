import { loadPageConfig } from '@weave-platform/next/server';
import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { WeavePageSections } from '../../../components/weave-page-sections';

export default function WeaveCmsPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<p>Loading Weave page…</p>}>
      <WeavePageContent params={params} />
    </Suspense>
  );
}

async function WeavePageContent({ params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await params;

  let config = null;
  try {
    config = await loadPageConfig(slug);
  } catch {
    config = null;
  }

  if (!config) {
    return (
      <p data-testid="weave-page-not-found" style={{ color: 'var(--color-text-muted)' }}>
        Weave page not found.
      </p>
    );
  }

  return (
    <article data-testid="weave-page">
      <p>
        <Link href="/">← Home</Link>
      </p>
      <h1
        data-testid="weave-page-title"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
      >
        Weave: {slug}
      </h1>
      <div data-testid="weave-sections">
        <WeavePageSections config={config} />
      </div>
    </article>
  );
}
