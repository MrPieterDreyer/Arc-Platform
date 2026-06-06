'use client';

import type { WooCartItem } from '@arc/core';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatMoney(minorAmount: string, symbol: string, minorUnit: number): string {
  const value = Number(minorAmount);
  if (!Number.isFinite(value)) return `${symbol}${minorAmount}`;
  return `${symbol}${(value / 10 ** minorUnit).toFixed(minorUnit)}`;
}

// ---------------------------------------------------------------------------
// Qty stepper sub-component
// ---------------------------------------------------------------------------

interface QtyStepperProps {
  quantity: number;
  min: number;
  max: number;
  isPending: boolean;
  onDecrement: () => void;
  onIncrement: () => void;
}

function QtyStepper({ quantity, min, max, isPending, onDecrement, onIncrement }: QtyStepperProps) {
  const btnStyle: React.CSSProperties = {
    width: 32,
    height: 32,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--color-background)',
    color: 'var(--color-text-primary)',
    cursor: isPending ? 'not-allowed' : 'pointer',
    fontSize: '1rem',
    lineHeight: 1,
    opacity: isPending ? 0.5 : 1,
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={isPending || quantity <= min}
        style={btnStyle}
        onClick={onDecrement}
      >
        −
      </button>
      <span
        aria-live="polite"
        aria-atomic="true"
        style={{ minWidth: 24, textAlign: 'center', fontSize: 'var(--text-label-size)' }}
      >
        {quantity}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={isPending || quantity >= max}
        style={btnStyle}
        onClick={onIncrement}
      >
        +
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CartLineItem
// ---------------------------------------------------------------------------

export interface CartLineItemProps {
  item: WooCartItem;
  isPending: boolean;
  onUpdate: (key: string, quantity: number) => void;
  onRemove: (key: string) => void;
}

export function CartLineItem({ item, isPending, onUpdate, onRemove }: CartLineItemProps) {
  const { key, name, quantity, quantity_limits, images, prices, totals } = item;
  const min = quantity_limits?.minimum ?? 1;
  const max = quantity_limits?.maximum ?? 99;
  const symbol = totals.currency_symbol;
  const minorUnit = totals.currency_minor_unit;
  const lineTotal = formatMoney(totals.line_subtotal, symbol, minorUnit);
  const unitPrice = formatMoney(prices.price, prices.currency_symbol, prices.currency_minor_unit);
  const thumbnail = images[0]?.thumbnail ?? images[0]?.src;
  const altText = images[0]?.alt || name;

  return (
    <li
      data-testid="cart-line-item"
      style={{
        display: 'grid',
        gridTemplateColumns: '64px 1fr',
        gap: 'var(--space-3)',
        padding: 'var(--space-4) 0',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {/* Thumbnail */}
      {thumbnail ? (
        // Using a plain img here — next/image requires domain config consumers may not have set up.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnail}
          alt={altText}
          width={64}
          height={64}
          style={{
            width: 64,
            height: 64,
            objectFit: 'cover',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          aria-hidden="true"
          style={{
            width: 64,
            height: 64,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        />
      )}

      {/* Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', minWidth: 0 }}>
        {/* Name + unit price */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
          <span
            style={{
              fontSize: 'var(--text-label-size)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {name}
          </span>
          <span
            style={{
              fontSize: 'var(--text-label-size)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text-primary)',
              whiteSpace: 'nowrap',
            }}
          >
            {lineTotal}
          </span>
        </div>

        {/* Unit price (muted) */}
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          {unitPrice} each
        </span>

        {/* Variant attributes */}
        {item.variation.length > 0 && (
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            {item.variation.map((v) => `${v.attribute}: ${v.value}`).join(', ')}
          </span>
        )}

        {/* Qty stepper + remove */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 'var(--space-1)',
          }}
        >
          {item.sold_individually ? (
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Sold individually
            </span>
          ) : (
            <QtyStepper
              quantity={quantity}
              min={min}
              max={max}
              isPending={isPending}
              onDecrement={() => onUpdate(key, quantity - 1)}
              onIncrement={() => onUpdate(key, quantity + 1)}
            />
          )}

          <button
            type="button"
            data-testid="cart-remove-item"
            aria-label={`Remove ${name} from cart`}
            disabled={isPending}
            onClick={() => onRemove(key)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-danger)',
              fontSize: 'var(--text-label-size)',
              cursor: isPending ? 'not-allowed' : 'pointer',
              padding: 'var(--space-1) var(--space-2)',
              borderRadius: 'var(--radius-sm)',
              opacity: isPending ? 0.5 : 1,
            }}
          >
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}
