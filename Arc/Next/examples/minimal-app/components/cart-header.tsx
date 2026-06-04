'use client';

import { useEffect, useState } from 'react';
import { CART_UPDATED_EVENT, readLatestCartCount } from '../lib/cart-sync';

export function CartHeader({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(() => Math.max(initialCount, readLatestCartCount()));

  useEffect(() => {
    setCount((prev) => Math.max(prev, initialCount, readLatestCartCount()));
  }, [initialCount]);

  useEffect(() => {
    const onUpdate = (event: Event) => {
      const detail = (event as CustomEvent<{ count: number }>).detail;
      if (typeof detail?.count === 'number') {
        setCount(detail.count);
      }
    };
    window.addEventListener(CART_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(CART_UPDATED_EVENT, onUpdate);
  }, []);

  return (
    <span
      data-testid="cart-badge"
      aria-live="polite"
      style={{
        marginLeft: 'var(--space-4)',
        fontSize: '0.875rem',
        color: count > 0 ? 'var(--color-accent)' : 'var(--color-text-muted)',
        fontWeight: count > 0 ? 600 : 400,
      }}
    >
      Cart ({count})
    </span>
  );
}
