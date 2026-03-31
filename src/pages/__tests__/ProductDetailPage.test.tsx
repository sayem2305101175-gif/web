import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SHOES } from '../../constants';
import { CartProvider } from '../../features/cart/context/CartContext';
import { WishlistProvider } from '../../features/wishlist/context/WishlistContext';
import ProductDetailPage from '../ProductDetailPage';

const subscriptionListeners = vi.hoisted(() => new Set<() => void>());

const mockedCatalogService = vi.hoisted(() => ({
  getAllShoes: vi.fn(),
  getNewArrivals: vi.fn(),
  getShoeById: vi.fn(),
  getShoesByBrand: vi.fn(),
}));

const mockedCatalogSubscribe = vi.hoisted(() =>
  vi.fn((listener: () => void) => {
    subscriptionListeners.add(listener);
    return () => {
      subscriptionListeners.delete(listener);
    };
  })
);

vi.mock('../../features/catalog/services/shoeService', () => ({
  shoeService: mockedCatalogService,
}));

vi.mock('../../features/commerce/repositories', () => ({
  storefrontCatalogRepository: {
    subscribe: mockedCatalogSubscribe,
  },
}));

vi.mock('../../services/apiClient', () => ({
  isBackendConfigured: false,
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    status = 500;
    responseBody = null;
  },
}));

const primaryShoe = SHOES[0];

if (!primaryShoe) {
  throw new Error('Expected primary shoe fixture to exist.');
}

const renderProductDetailRoute = (productId: string) =>
  render(
    <CartProvider>
      <WishlistProvider>
        <MemoryRouter initialEntries={[`/product/${encodeURIComponent(productId)}`]}>
          <Routes>
            <Route path="/product/:productId" element={<ProductDetailPage />} />
          </Routes>
        </MemoryRouter>
      </WishlistProvider>
    </CartProvider>
  );

const emitCatalogRefresh = async () => {
  await act(async () => {
    subscriptionListeners.forEach((listener) => listener());
  });
};

describe('ProductDetailPage', () => {
  beforeEach(() => {
    subscriptionListeners.clear();
    mockedCatalogSubscribe.mockClear();
    mockedCatalogService.getShoesByBrand.mockResolvedValue([...SHOES]);
    mockedCatalogService.getNewArrivals.mockResolvedValue(SHOES.filter((shoe) => Boolean(shoe.isNew)));
    mockedCatalogService.getShoeById.mockImplementation(async (id: string) => SHOES.find((shoe) => shoe.id === id));
    mockedCatalogService.getAllShoes.mockResolvedValue([...SHOES]);
  });

  afterEach(() => {
    subscriptionListeners.clear();
    vi.clearAllMocks();
  });

  it('shows the not-found state for invalid product ids', async () => {
    mockedCatalogService.getShoeById.mockResolvedValueOnce(undefined);

    renderProductDetailRoute('missing-product');

    await screen.findByText(/this product could not be found\./i);
    expect(screen.getByRole('link', { name: /back to collection/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });

  it('shows a retry error state when the primary product load fails and recovers on retry', async () => {
    mockedCatalogService.getShoeById.mockRejectedValueOnce(new Error('Catalog timeout'));

    renderProductDetailRoute(primaryShoe.id);

    await screen.findByRole('heading', { name: /product details could not be loaded\./i });
    expect(screen.getByText(/the latest product details could not be loaded\. please try again\./i)).toBeInTheDocument();
    expect(screen.queryByText(/this product could not be found\./i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    await screen.findByText(new RegExp(`product id: ${primaryShoe.id}`, 'i'));
    expect(screen.getAllByText(primaryShoe.name).length).toBeGreaterThan(0);
  });

  it('clears stale product details when a subscription refresh fails', async () => {
    renderProductDetailRoute(primaryShoe.id);

    await screen.findByText(new RegExp(`product id: ${primaryShoe.id}`, 'i'));
    mockedCatalogService.getShoeById.mockRejectedValueOnce(new Error('Refresh failed'));

    await emitCatalogRefresh();

    await screen.findByRole('heading', { name: /product details could not be loaded\./i });
    expect(screen.queryByText(new RegExp(`product id: ${primaryShoe.id}`, 'i'))).not.toBeInTheDocument();
    expect(screen.queryByText(primaryShoe.description)).not.toBeInTheDocument();
  });

  it('keeps the main product view when related products fail to load', async () => {
    mockedCatalogService.getAllShoes.mockRejectedValueOnce(new Error('Related products failed'));

    renderProductDetailRoute(primaryShoe.id);

    await screen.findByText(new RegExp(`product id: ${primaryShoe.id}`, 'i'));
    expect(screen.getByText(primaryShoe.description)).toBeInTheDocument();
    expect(screen.queryByText(/product details could not be loaded\./i)).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /you may also like/i })).not.toBeInTheDocument();
  });
});
