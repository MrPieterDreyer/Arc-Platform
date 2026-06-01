import type { ReactNode } from 'react';
import '../../../../../Design-Systems/Arc-Design/tokens/arc-tokens.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{ margin: 0, fontFamily: 'var(--font-sans)', background: 'var(--color-background)' }}
      >
        <header
          style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)' }}
        >
          <strong style={{ fontFamily: 'var(--font-display)' }}>Arc Next — minimal example</strong>
        </header>
        <main style={{ padding: 'var(--space-6)' }}>{children}</main>
      </body>
    </html>
  );
}
