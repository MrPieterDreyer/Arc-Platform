'use client';

import type { WooCart } from '@arc/core';
import { useEffect, useState } from 'react';
import { CART_UPDATED_EVENT, readLatestCartCount } from '../lib/cart-sync';
import { CartDrawer } from './cart-drawer/cart-drawer';

export function CartHeader({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(() => Math.max(initialCount, readLatestCartCount()));
  const [isOpen, setIsOpen] = useState(false);
  // Cart state is lazily loaded when the drawer opens for the first time.
  // null = never loaded; WooCart = loaded (may be empty items array).
  const [cart, setCart] = useState<WooCart | null>(null);

  // Sync count from server-rendered initial value
  useEffect(() => {
    setCount((prev) => Math.max(prev, initialCount, readLatestCartCount()));
  }, [initialCount]);

  // Keep count in sync with any cart mutations elsewhere on the page
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

  function openDrawer() {
    setIsOpen(true);
  }

  function closeDrawer() {
    setIsOpen(false);
  }

  function handleCartUpdate(next: WooCart) {
    setCart(next);
    setCount(next.items_count ?? 0);
  }

  return (
    <>
      <button
        type="button"
        data-testid="cart-header-button"
        aria-label={`Open cart, ${count} ${count === 1 ? 'item' : 'items'}`}
        aria-expanded={isOpen}
        aria-controls="cart-drawer"
        onClick={openDrawer}
        style={{
          marginLeft: 'var(--space-4)',
          background: 'none',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          padding: 'var(--space-2) var(--space-3)',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          fontSize: 'var(--text-label-size)',
          color: count > 0 ? 'var(--color-accent)' : 'var(--color-text-muted)',
          fontWeight: count > 0 ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
        }}
      >
        {/* Cart icon (inline SVG — no external dependency) */}
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>

        {/* Badge — aria-live for screen reader announcements */}
        <span data-testid="cart-badge" aria-live="polite" aria-atomic="true">
          Cart ({count})
        </span>
      </button>

      <CartDrawer
        cart={cart}
        isOpen={isOpen}
        onClose={closeDrawer}
        onCartUpdate={handleCartUpdate}
      />
    </>
  );
}
