'use client';

import type { WooCart } from '@arc/core';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { CartLineItem } from './cart-line-item';
import { useCartDrawer } from './use-cart-drawer';
import { useFocusTrap } from './use-focus-trap';

// ---------------------------------------------------------------------------
// Money formatter
// ---------------------------------------------------------------------------

function formatMoney(minorAmount: string, symbol: string, minorUnit: number): string {
  const value = Number(minorAmount);
  if (!Number.isFinite(value)) return `${symbol}${minorAmount}`;
  return `${symbol}${(value / 10 ** minorUnit).toFixed(minorUnit)}`;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CartDrawerProps {
  /** Current server-reconciled cart. Caller manages this state. */
  cart: WooCart | null;
  /** Whether the drawer is visible. */
  isOpen: boolean;
  /** Close callback — called on backdrop click, Escape key, or close button. */
  onClose: () => void;
  /** Called when a Server Action returns a fresh cart (after update/remove). */
  onCartUpdate: (cart: WooCart) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CartDrawer({ cart, isOpen, onClose, onCartUpdate }: CartDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  useFocusTrap(panelRef, isOpen);

  // Dismiss on Escape
  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const { optimisticCart, isPending, update, remove, errorLabel } = useCartDrawer({
    cart,
    onCartUpdate,
  });

  const items = optimisticCart?.items ?? [];
  const totals = optimisticCart?.totals;
  const subtotal = totals
    ? formatMoney(totals.total_items, totals.currency_symbol, totals.currency_minor_unit)
    : null;

  async function handleUpdate(key: string, quantity: number) {
    setMutationError(null);
    try {
      await update(key, quantity);
    } catch {
      setMutationError(errorLabel);
    }
  }

  async function handleRemove(key: string) {
    setMutationError(null);
    try {
      await remove(key);
    } catch {
      setMutationError(errorLabel);
    }
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          aria-hidden="true"
          data-testid="cart-drawer-backdrop"
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--color-overlay)',
            zIndex: 'calc(var(--z-modal) - 1)',
            animation: 'arc-fade-in var(--duration-fast) var(--ease-out)',
          }}
        />
      )}

      {/* Slide-out panel */}
      <div
        ref={panelRef}
        id="cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        data-testid="cart-drawer"
        // inert is the standard HTML attribute for disabling interaction when closed.
        // React 19 supports it natively as a boolean prop.
        inert={!isOpen || undefined}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(420px, 100vw)',
          background: 'var(--color-background)',
          boxShadow: 'var(--shadow-card)',
          zIndex: 'var(--z-modal)',
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform var(--duration-normal) var(--ease-out)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-4) var(--space-6)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-heading-size)',
              color: 'var(--color-text-primary)',
            }}
          >
            Your cart
            {items.length > 0 && (
              <span
                aria-live="polite"
                style={{
                  marginLeft: 'var(--space-2)',
                  fontSize: 'var(--text-label-size)',
                  fontWeight: 'var(--font-weight-regular)',
                  color: 'var(--color-text-muted)',
                }}
              >
                ({items.length} {items.length === 1 ? 'item' : 'items'})
              </span>
            )}
          </h2>
          <button
            type="button"
            aria-label="Close cart"
            data-testid="cart-drawer-close"
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              width: 36,
              height: 36,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-muted)',
              fontSize: '1.25rem',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Error banner */}
        {mutationError && (
          <div
            role="alert"
            data-testid="cart-drawer-error"
            style={{
              padding: 'var(--space-3) var(--space-6)',
              background: 'rgba(198, 30, 108, 0.08)',
              borderBottom: '1px solid var(--color-border)',
              color: 'var(--color-danger)',
              fontSize: 'var(--text-label-size)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 'var(--space-4)',
            }}
          >
            <span>{mutationError}</span>
            <button
              type="button"
              onClick={() => setMutationError(null)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-danger)',
                cursor: 'pointer',
                fontWeight: 'var(--font-weight-semibold)',
                fontSize: 'var(--text-label-size)',
                padding: 0,
              }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Pending indicator */}
        {isPending && (
          <div
            aria-hidden="true"
            style={{
              height: 3,
              background: 'var(--color-accent)',
              animation: 'arc-progress var(--duration-normal) linear infinite',
            }}
          />
        )}

        {/* Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0 var(--space-6)',
          }}
        >
          {items.length === 0 ? (
            <div
              data-testid="cart-drawer-empty"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                gap: 'var(--space-4)',
                textAlign: 'center',
                color: 'var(--color-text-muted)',
              }}
            >
              <span style={{ fontSize: '2.5rem', lineHeight: 1 }} aria-hidden="true">
                🛒
              </span>
              <p style={{ margin: 0, fontSize: 'var(--text-body-size)' }}>Your cart is empty</p>
              <Link
                href="/products"
                data-testid="cart-drawer-continue-shopping"
                onClick={onClose}
                style={{
                  color: 'var(--color-accent)',
                  fontSize: 'var(--text-label-size)',
                  fontWeight: 'var(--font-weight-semibold)',
                  textDecoration: 'none',
                }}
              >
                Continue shopping
              </Link>
            </div>
          ) : (
            <ul
              data-testid="cart-drawer-line-items"
              style={{ padding: 0, margin: 0, listStyle: 'none' }}
              aria-label="Cart items"
            >
              {items.map((item) => (
                <CartLineItem
                  key={item.key}
                  item={item}
                  isPending={isPending}
                  onUpdate={handleUpdate}
                  onRemove={handleRemove}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Footer — only shown when cart has items */}
        {items.length > 0 && (
          <div
            style={{
              borderTop: '1px solid var(--color-border)',
              padding: 'var(--space-4) var(--space-6)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
            }}
          >
            {/* Subtotal */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
              }}
            >
              <span
                style={{
                  fontSize: 'var(--text-label-size)',
                  color: 'var(--color-text-muted)',
                }}
              >
                Subtotal
              </span>
              <span
                data-testid="cart-drawer-subtotal"
                aria-live="polite"
                style={{
                  fontSize: 'var(--text-price-size)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-text-primary)',
                }}
              >
                {subtotal ?? '—'}
              </span>
            </div>

            {/* Checkout CTA */}
            <Link
              href="/checkout"
              data-testid="cart-drawer-checkout"
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 44,
                padding: '0 var(--space-4)',
                background: 'var(--btn-primary-bg)',
                color: 'var(--btn-primary-fg)',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                fontSize: 'var(--text-body-size)',
                textDecoration: 'none',
                textAlign: 'center',
                opacity: isPending ? 0.7 : 1,
                pointerEvents: isPending ? 'none' : 'auto',
              }}
            >
              Proceed to checkout
            </Link>

            <p
              style={{
                margin: 0,
                textAlign: 'center',
                fontSize: '0.75rem',
                color: 'var(--color-text-muted)',
              }}
            >
              Shipping &amp; taxes calculated at checkout
            </p>
          </div>
        )}
      </div>

      {/* Keyframe animations injected once */}
      <style>{`
        @keyframes arc-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes arc-progress {
          0%   { transform: scaleX(0); transform-origin: left; }
          50%  { transform: scaleX(0.6); transform-origin: left; }
          100% { transform: scaleX(1); transform-origin: left; }
        }
      `}</style>
    </>
  );
}
