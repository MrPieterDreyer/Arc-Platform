// @vitest-environment jsdom
/**
 * hooks.test.ts — React 19 hooks unit tests for @arc/core
 *
 * ARC-HOOK-01: useCart
 * ARC-HOOK-02: useProduct
 * ARC-HOOK-03: useCollection
 * ARC-HOOK-04: useCustomer
 * ARC-HOOK-05: useSearch
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Minimal WooClient mock factory
// ---------------------------------------------------------------------------
function makeMockClient(overrides: Record<string, unknown> = {}) {
  return {
    request: vi.fn(),
    getCart: vi.fn(),
    addToCart: vi.fn(),
    updateCartItem: vi.fn(),
    removeCartItem: vi.fn(),
    applyCoupon: vi.fn(),
    removeCoupon: vi.fn(),
    ...overrides,
  } as unknown;
}

// Minimal WCCart fixture
const emptyCart = {
  items: [],
  item_count: 0,
  items_weight: 0,
  coupons: [],
  totals: {},
  shipping_address: {},
  billing_address: {},
  fees: [],
  tax_lines: [],
  shipping_rates: [],
  errors: [],
  needs_shipping: false,
  needs_payment: false,
  cross_sells: [],
  payment_requirements: [],
};

const cartWithItem = {
  ...emptyCart,
  items: [{ key: 'item-1', id: 42, quantity: 2, name: 'Test Shirt', prices: {} }],
  item_count: 2,
};

// ---------------------------------------------------------------------------
// ARC-HOOK-01: useCart
// ---------------------------------------------------------------------------
describe('ARC-HOOK-01: useCart', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('getServerSnapshot returns empty cart (SSR-safe)', async () => {
    const { getOrCreateCartStore } = await import('../../hooks/useCart.js');
    const client = makeMockClient() as Parameters<typeof getOrCreateCartStore>[0];
    const store = getOrCreateCartStore(client);
    const snapshot = store.getServerSnapshot();
    expect(snapshot).toEqual({ cart: null, loading: false });
  });

  it('useCart state is shared across two consumers of the same WooClient instance', async () => {
    const { getOrCreateCartStore } = await import('../../hooks/useCart.js');
    const client = makeMockClient() as Parameters<typeof getOrCreateCartStore>[0];
    const store = getOrCreateCartStore(client);

    // Two separate subscriptions should receive the same underlying store
    const snapA = store.getSnapshot();
    const snapB = store.getSnapshot();
    expect(snapA).toBe(snapB); // same reference = same object

    // After setCart, both see the update
    let notified = 0;
    store.subscribe(() => { notified++; });
    store.subscribe(() => { notified++; });

    act(() => { store.setCart(cartWithItem as never); });
    expect(notified).toBe(2);
    expect(store.getSnapshot().cart?.item_count).toBe(2);
  });

  it('useCart hook renders with null cart initially and loads from refresh', async () => {
    // Dynamically import after reset so WeakMap is fresh
    const cartModule = await import('../../hooks/useCart.js');
    const storeApiCart = await import('../../store-api/cart.js');

    // Mock getCart at module level
    vi.spyOn(storeApiCart, 'getCart').mockResolvedValue(cartWithItem as never);

    const client = makeMockClient() as Parameters<typeof cartModule.useCart>[0];

    const { result } = renderHook(() => cartModule.useCart(client));

    // Initially null
    expect(result.current.cart).toBeNull();

    // After refresh
    await act(async () => { await result.current.refresh(); });
    expect(result.current.cart?.item_count).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// ARC-HOOK-02: useProduct
// ---------------------------------------------------------------------------
describe('ARC-HOOK-02: useProduct', () => {
  it('fetches and returns product on mount', async () => {
    const { useProduct } = await import('../../hooks/useProduct.js');
    const gqlProducts = await import('../../graphql/products.js');

    const fixture = {
      databaseId: 1,
      slug: 'test-slug',
      name: 'Test Product',
      price: '$29.99',
      featuredImage: null,
    };

    vi.spyOn(gqlProducts, 'getProduct').mockResolvedValue(fixture as never);

    const mockGqlClient = {} as Parameters<typeof useProduct>[0];
    const { result } = renderHook(() => useProduct(mockGqlClient, 'test-slug'));

    expect(result.current.loading).toBe(true);
    expect(result.current.product).toBeNull();

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.product?.slug).toBe('test-slug');
    expect(result.current.product?.name).toBe('Test Product');
  });

  it('returns null product and error when fetch fails', async () => {
    const { useProduct } = await import('../../hooks/useProduct.js');
    const gqlProducts = await import('../../graphql/products.js');

    vi.spyOn(gqlProducts, 'getProduct').mockRejectedValue(new Error('Not found'));

    const mockGqlClient = {} as Parameters<typeof useProduct>[0];
    const { result } = renderHook(() => useProduct(mockGqlClient, 'bad-slug'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.product).toBeNull();
    expect(result.current.error).toBe('Not found');
  });
});

// ---------------------------------------------------------------------------
// ARC-HOOK-03: useCollection
// ---------------------------------------------------------------------------
describe('ARC-HOOK-03: useCollection', () => {
  it('returns collection + products and supports loadMore', async () => {
    const { useCollection } = await import('../../hooks/useCollection.js');
    const gqlCollections = await import('../../graphql/collections.js');

    const collectionFixture = {
      databaseId: 10,
      slug: 'shoes',
      name: 'Shoes',
      count: 5,
      image: null,
    };
    const productListPage1 = {
      pageInfo: { hasNextPage: true, endCursor: 'cursor-1' },
      nodes: [{ databaseId: 1, slug: 'shoe-a', name: 'Shoe A', price: '$50', featuredImage: null }],
    };
    const productListPage2 = {
      pageInfo: { hasNextPage: false, endCursor: null },
      nodes: [{ databaseId: 2, slug: 'shoe-b', name: 'Shoe B', price: '$60', featuredImage: null }],
    };

    vi.spyOn(gqlCollections, 'getCollection').mockResolvedValue(collectionFixture as never);
    const getProductsSpy = vi
      .spyOn(gqlCollections, 'getCollectionProducts')
      .mockResolvedValueOnce(productListPage1 as never)
      .mockResolvedValueOnce(productListPage2 as never);

    const mockGqlClient = {} as Parameters<typeof useCollection>[0];
    const { result } = renderHook(() => useCollection(mockGqlClient, 'shoes'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.collection?.slug).toBe('shoes');
    expect(result.current.products?.nodes).toHaveLength(1);
    expect(result.current.products?.pageInfo.hasNextPage).toBe(true);

    // loadMore — appends next page
    await act(async () => { await result.current.loadMore(); });
    expect(getProductsSpy).toHaveBeenCalledWith(mockGqlClient, 'shoes', { after: 'cursor-1' });
    expect(result.current.products?.nodes).toHaveLength(2);
    expect(result.current.products?.pageInfo.hasNextPage).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// ARC-HOOK-04: useCustomer
// ---------------------------------------------------------------------------
describe('ARC-HOOK-04: useCustomer', () => {
  it('returns session-scoped customer address data', async () => {
    const { useCustomer } = await import('../../hooks/useCustomer.js');
    const storeApiCustomer = await import('../../store-api/customer.js');

    const customerFixture = {
      id: 0,
      email: 'guest@example.com',
      first_name: 'Jane',
      last_name: 'Doe',
      billing: { first_name: 'Jane', address_1: '123 Main St', city: 'Portland', country: 'US', last_name: 'Doe', company: '', address_2: '', state: 'OR', postcode: '97201', phone: '', email: 'guest@example.com' },
      shipping: { first_name: 'Jane', address_1: '123 Main St', city: 'Portland', country: 'US', last_name: 'Doe', company: '', address_2: '', state: 'OR', postcode: '97201', phone: '', email: '' },
    };

    vi.spyOn(storeApiCustomer, 'getCustomer').mockResolvedValue(customerFixture as never);

    const mockStoreClient = makeMockClient() as Parameters<typeof useCustomer>[0];
    const { result } = renderHook(() => useCustomer(mockStoreClient));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.customer?.billing.city).toBe('Portland');
    // No gqlClient provided — orders must be null
    expect(result.current.orders).toBeNull();
  });

  it('returns orders when gqlClient is provided', async () => {
    const { useCustomer } = await import('../../hooks/useCustomer.js');
    const storeApiCustomer = await import('../../store-api/customer.js');
    const gqlCustomer = await import('../../graphql/customer.js');

    const customerFixture = { id: 1, email: 'member@example.com', first_name: 'John', last_name: 'Smith', billing: {}, shipping: {} };
    const ordersFixture = { databaseId: 1, email: 'member@example.com', firstName: 'John', lastName: 'Smith', billing: {}, shipping: {}, orders: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: [] } };

    vi.spyOn(storeApiCustomer, 'getCustomer').mockResolvedValue(customerFixture as never);
    vi.spyOn(gqlCustomer, 'getCustomerOrders').mockResolvedValue(ordersFixture as never);

    const mockStoreClient = makeMockClient() as Parameters<typeof useCustomer>[0];
    const mockGqlClient = {} as NonNullable<Parameters<typeof useCustomer>[1]>;
    const { result } = renderHook(() => useCustomer(mockStoreClient, mockGqlClient));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.orders?.databaseId).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// ARC-HOOK-05: useSearch
// ---------------------------------------------------------------------------
describe('ARC-HOOK-05: useSearch', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('debounces the query and calls searchProducts after debounce delay', async () => {
    const { useSearch } = await import('../../hooks/useSearch.js');
    const gqlSearch = await import('../../graphql/search.js');

    const resultFixture = {
      pageInfo: { hasNextPage: false, endCursor: null },
      nodes: [{ databaseId: 1, slug: 'shirt-a', name: 'Shirt A', price: '$25', featuredImage: null }],
    };

    const searchSpy = vi.spyOn(gqlSearch, 'searchProducts').mockResolvedValue(resultFixture as never);

    const mockGqlClient = {} as Parameters<typeof useSearch>[0];
    const { result } = renderHook(() => useSearch(mockGqlClient, 300));

    // Set query — should not fire immediately
    act(() => { result.current.setQuery('shirt'); });
    expect(searchSpy).not.toHaveBeenCalled();

    // Advance 250ms — still not fired
    act(() => { vi.advanceTimersByTime(250); });
    expect(searchSpy).not.toHaveBeenCalled();

    // Advance remaining 50ms — now fires
    await act(async () => { vi.advanceTimersByTime(50); });
    expect(searchSpy).toHaveBeenCalledOnce();
    expect(searchSpy).toHaveBeenCalledWith(mockGqlClient, 'shirt', undefined);
  });

  it('cancels previous debounce when query changes quickly', async () => {
    const { useSearch } = await import('../../hooks/useSearch.js');
    const gqlSearch = await import('../../graphql/search.js');

    const searchSpy = vi.spyOn(gqlSearch, 'searchProducts').mockResolvedValue({
      pageInfo: { hasNextPage: false, endCursor: null },
      nodes: [],
    } as never);

    const mockGqlClient = {} as Parameters<typeof useSearch>[0];
    const { result } = renderHook(() => useSearch(mockGqlClient, 300));

    // First query
    act(() => { result.current.setQuery('shoes'); });
    // Advance only 200ms
    act(() => { vi.advanceTimersByTime(200); });
    // Before it fires, set new query
    act(() => { result.current.setQuery('boots'); });
    // Advance full 300ms from new query
    await act(async () => { vi.advanceTimersByTime(300); });

    // searchProducts called exactly once with 'boots' (not 'shoes')
    expect(searchSpy).toHaveBeenCalledOnce();
    expect(searchSpy).toHaveBeenCalledWith(mockGqlClient, 'boots', undefined);
  });

  it('does not search when query is empty', async () => {
    const { useSearch } = await import('../../hooks/useSearch.js');
    const gqlSearch = await import('../../graphql/search.js');
    const searchSpy = vi.spyOn(gqlSearch, 'searchProducts');

    const mockGqlClient = {} as Parameters<typeof useSearch>[0];
    const { result } = renderHook(() => useSearch(mockGqlClient, 300));

    act(() => { result.current.setQuery('  '); });
    await act(async () => { vi.advanceTimersByTime(300); });
    expect(searchSpy).not.toHaveBeenCalled();
  });
});
