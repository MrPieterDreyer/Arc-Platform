import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { __resetCartValidationWarnings, safeValidateCart } from '../../store-api/validate';
import type { WooCart } from '../../types/woo';

/** A structurally-valid minimal cart (only the invariants the validator checks). */
function validCart(overrides: Record<string, unknown> = {}): WooCart {
  return {
    items: [],
    item_count: 0,
    totals: { total_price: '0', currency_code: 'USD' },
    ...overrides,
  } as unknown as WooCart;
}

describe('safeValidateCart', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    __resetCartValidationWarnings();
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.stubEnv('NODE_ENV', 'development');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('returns the value unchanged on a valid cart and does not warn', () => {
    const cart = validCart({ item_count: 3 });
    expect(safeValidateCart(cart)).toBe(cart);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('warns on a structurally-invalid cart but still returns it (never throws)', () => {
    const broken = { item_count: 'three', totals: {} } as unknown as WooCart;
    expect(safeValidateCart(broken)).toBe(broken);
    expect(warnSpy).toHaveBeenCalledOnce();
  });

  it('tolerates additive/unknown fields via passthrough', () => {
    const cart = validCart({ some_new_woo_field: true });
    expect(safeValidateCart(cart)).toBe(cart);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('never warns in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const broken = { item_count: null } as unknown as WooCart;
    expect(safeValidateCart(broken)).toBe(broken);
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
