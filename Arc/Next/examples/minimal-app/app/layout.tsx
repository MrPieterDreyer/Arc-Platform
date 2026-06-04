import type { ReactNode } from 'react';
import { Suspense } from 'react';
import '../../../../../Design-Systems/Arc-Design/tokens/arc-tokens.css';
import { CartHeader } from '../components/cart-header';
import { readCartItemCount } from '../lib/read-cart-count';

async function CartBadge() {
  const initialCartCount = await readCartItemCount();
  return <CartHeader initialCount={initialCartCount} />;
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{ margin: 0, fontFamily: 'var(--font-sans)', background: 'var(--color-background)' }}
      >
        <header
          style={{
            padding: 'var(--space-4)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <strong style={{ fontFamily: 'var(--font-display)' }}>Arc Next — minimal example</strong>
          <Suspense
            fallback={
              <span
                data-testid="cart-badge"
                aria-live="polite"
                style={{
                  marginLeft: 'var(--space-4)',
                  fontSize: '0.875rem',
                  color: 'var(--color-text-muted)',
                }}
              >
                Cart (…)
              </span>
            }
          >
            <CartBadge />
          </Suspense>
        </header>
        <main style={{ padding: 'var(--space-6)' }}>{children}</main>
        <style
          dangerouslySetInnerHTML={{
            __html: `a:focus-visible, button:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }`,
          }}
        />
      </body>
    </html>
  );
}
