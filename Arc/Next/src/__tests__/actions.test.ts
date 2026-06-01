import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WooClientError, type WooCart } from '@arc/core';

const mocks = vi.hoisted(() => ({
  createCartClient: vi.fn(),
  refreshCartTokenCookie: vi.fn(),
  addItem: vi.fn(),
  updateItem: vi.fn(),
  removeItem: vi.fn(),
}));

vi.mock('../cookies.js', () => ({
  createCartClient: mocks.createCartClient,
  refreshCartTokenCookie: mocks.refreshCartTokenCookie,
}));

vi.mock('@arc/core', async () => {
  const actual = await vi.importActual<typeof import('@arc/core')>('@arc/core');
  return {
    ...actual,
    addItem: mocks.addItem,
    updateItem: mocks.updateItem,
    removeItem: mocks.removeItem,
  };
});

const mockCart = {
  items_count: 1,
} as WooCart;

describe('ARC-NEXT-03 — cart Server Actions', () => {
  beforeEach(() => {
    mocks.createCartClient.mockResolvedValue({ id: 'client' });
    mocks.refreshCartTokenCookie.mockResolvedValue(undefined);
    mocks.addItem.mockResolvedValue(mockCart);
  });

  it('addItemAction refreshes cookie after success', async () => {
    const { addItemAction } = await import('../actions.js');
    await addItemAction({ id: 1, quantity: 1 }, 'https://shop.test');
    expect(mocks.refreshCartTokenCookie).toHaveBeenCalled();
  });

  it('does not refresh cookie when addItem throws', async () => {
    mocks.addItem.mockRejectedValueOnce(
      new WooClientError({ code: 'network', message: 'fail', data: { status: 500 } }),
    );
    const { addItemAction } = await import('../actions.js');
    await expect(addItemAction({ id: 1, quantity: 1 }, 'https://shop.test')).rejects.toBeInstanceOf(
      WooClientError,
    );
    expect(mocks.refreshCartTokenCookie).not.toHaveBeenCalled();
  });
});
