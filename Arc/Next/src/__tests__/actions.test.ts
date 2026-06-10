import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WooClientError, type WooCart } from '@arc-platform/core';

const mocks = vi.hoisted(() => ({
  createCartClient: vi.fn(),
  refreshCartTokenCookie: vi.fn(),
  readCartTokenValue: vi.fn(),
  getCart: vi.fn(),
  addItem: vi.fn(),
  updateItem: vi.fn(),
  removeItem: vi.fn(),
}));

vi.mock('../cookies.js', () => ({
  createCartClient: mocks.createCartClient,
  refreshCartTokenCookie: mocks.refreshCartTokenCookie,
  readCartTokenValue: mocks.readCartTokenValue,
}));

vi.mock('@arc-platform/core', async () => {
  const actual = await vi.importActual<typeof import('@arc-platform/core')>('@arc-platform/core');
  return {
    ...actual,
    getCart: mocks.getCart,
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
    vi.clearAllMocks();
    mocks.createCartClient.mockResolvedValue({ id: 'client' });
    mocks.refreshCartTokenCookie.mockResolvedValue(undefined);
    mocks.getCart.mockResolvedValue(mockCart);
    mocks.addItem.mockResolvedValue(mockCart);
    mocks.updateItem.mockResolvedValue(mockCart);
    mocks.removeItem.mockResolvedValue(mockCart);
    // Default to a warm session (token already present) so the legacy tests below
    // exercise the write path without an extra GET.
    mocks.readCartTokenValue.mockResolvedValue('existing-token');
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

  describe('session establishment before writes (cold-visitor 401 fix)', () => {
    it('GETs /cart before the write when no Cart-Token cookie exists (cold)', async () => {
      mocks.readCartTokenValue.mockResolvedValue(null);
      const { addItemAction } = await import('../actions.js');

      await addItemAction({ id: 11, quantity: 1 }, 'https://shop.test');

      expect(mocks.getCart).toHaveBeenCalledWith({ id: 'client' });
      // session GET must precede the add-item write so the client can replay the Cart-Token
      expect(mocks.getCart.mock.invocationCallOrder[0]).toBeLessThan(
        mocks.addItem.mock.invocationCallOrder[0],
      );
    });

    it('skips the session GET when a Cart-Token cookie already exists (warm)', async () => {
      mocks.readCartTokenValue.mockResolvedValue('existing-token');
      const { addItemAction } = await import('../actions.js');

      await addItemAction({ id: 11, quantity: 1 }, 'https://shop.test');

      expect(mocks.getCart).not.toHaveBeenCalled();
      expect(mocks.addItem).toHaveBeenCalledTimes(1);
    });

    it('establishes a session for updateItemAction and removeItemAction when cold', async () => {
      mocks.readCartTokenValue.mockResolvedValue(null);
      const { updateItemAction, removeItemAction } = await import('../actions.js');

      await updateItemAction({ key: 'abc', quantity: 2 }, 'https://shop.test');
      await removeItemAction({ key: 'abc' }, 'https://shop.test');

      expect(mocks.getCart).toHaveBeenCalledTimes(2);
      expect(mocks.updateItem).toHaveBeenCalledTimes(1);
      expect(mocks.removeItem).toHaveBeenCalledTimes(1);
    });
  });
});
