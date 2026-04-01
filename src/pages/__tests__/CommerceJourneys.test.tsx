import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SHOES } from '../../constants';
import { CartProvider } from '../../features/cart/context/CartContext';
import { ToastProvider } from '../../features/shared/context/ToastContext';
import Layout from '../../features/shared/ui/Layout';
import { CART_STORAGE_KEY, RECENT_ORDER_STORAGE_KEY } from '../../lib/storage';
import { WishlistProvider } from '../../features/wishlist/context/WishlistContext';
import CheckoutPage from '../CheckoutPage';
import CollectionPage from '../CollectionPage';
import ProductDetailPage from '../ProductDetailPage';

const mockedCatalogService = vi.hoisted(() => ({
  getAllShoes: vi.fn(),
  getNewArrivals: vi.fn(),
  getShoeById: vi.fn(),
  getShoesByBrand: vi.fn(),
}));

vi.mock('../../features/catalog/services/shoeService', () => ({
  shoeService: mockedCatalogService,
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

const SHARED_STORE_KEY = 'velosnak_admin_storefront_shared_v1';

const seedCartWithPrimaryShoe = () => {
  window.localStorage.setItem(
    CART_STORAGE_KEY,
    JSON.stringify([
      {
        ...primaryShoe,
        lineId: `${primaryShoe.id}-us-7`,
        quantity: 1,
        selectedSize: primaryShoe.sizes[0] ?? 'US 9',
      },
    ])
  );
};

const renderCommerceApp = (initialEntry: string) =>
  render(
    <CartProvider>
      <WishlistProvider>
        <ToastProvider>
          <MemoryRouter initialEntries={[initialEntry]}>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route path="collection" element={<CollectionPage />} />
                <Route path="product/:productId" element={<ProductDetailPage />} />
                <Route path="checkout" element={<CheckoutPage />} />
              </Route>
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </WishlistProvider>
    </CartProvider>
  );

describe('Commerce Journeys', () => {
  beforeEach(() => {
    localStorage.clear();
    window.localStorage.removeItem(SHARED_STORE_KEY);
    window.localStorage.removeItem(RECENT_ORDER_STORAGE_KEY);
    mockedCatalogService.getShoesByBrand.mockResolvedValue([...SHOES]);
    mockedCatalogService.getNewArrivals.mockResolvedValue(SHOES.filter((shoe) => Boolean(shoe.isNew)));
    mockedCatalogService.getShoeById.mockImplementation(async (id: string) =>
      SHOES.find((shoe) => shoe.id === id)
    );
    mockedCatalogService.getAllShoes.mockResolvedValue([...SHOES]);
  });

  afterEach(() => {
    window.localStorage.removeItem(SHARED_STORE_KEY);
    window.localStorage.removeItem(RECENT_ORDER_STORAGE_KEY);
    vi.clearAllMocks();
  });

  it('navigates from collection to route-backed product detail while keeping 3D surfaces active', async () => {
    const { container } = renderCommerceApp('/collection');

    await screen.findByRole('button', { name: /open details for phantom velocity x/i });
    await waitFor(() => {
      expect(container.querySelector('model-viewer')).not.toBeNull();
    });

    fireEvent.click(screen.getByText('Phantom Velocity X'));

    await screen.findByText(/product id: 1/i);
    expect(screen.getByText(/3d preview enabled/i)).toBeInTheDocument();
  });

  it('supports buy-now product journey into checkout with the selected item in cart', async () => {
    renderCommerceApp('/product/1');

    await screen.findByText(/product id: 1/i);
    fireEvent.click(screen.getByRole('button', { name: /buy now/i }));

    await screen.findByRole('heading', { name: /complete your order/i });
    expect(screen.getByText('Phantom Velocity X')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Journey Tester' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'journey@example.com' } });
    fireEvent.change(screen.getByLabelText(/city/i), { target: { value: 'Dhaka' } });
    fireEvent.change(screen.getByLabelText(/country/i), { target: { value: 'Bangladesh' } });
    fireEvent.click(screen.getByRole('button', { name: /place order/i }));

    await screen.findByRole('heading', { name: /order confirmed/i });
    const recentOrder = JSON.parse(window.localStorage.getItem(RECENT_ORDER_STORAGE_KEY) ?? 'null') as {
      contact?: { email?: string };
    } | null;
    expect(recentOrder?.contact?.email).toBe('journey@example.com');
  });

  it('shows a catalog error state when collection loading fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mockedCatalogService.getShoesByBrand.mockRejectedValueOnce(new Error('Backend unavailable.'));

    renderCommerceApp('/collection');

    await screen.findByText(/collection unavailable\./i);
    expect(screen.getByText(/backend unavailable\./i)).toBeInTheDocument();
    consoleErrorSpy.mockRestore();
  });

  it('shows product unavailable state for invalid route IDs', async () => {
    mockedCatalogService.getShoeById.mockResolvedValueOnce(undefined);

    renderCommerceApp('/product/not-a-real-id');

    await screen.findByText(/this product could not be found\./i);
    expect(screen.getByRole('link', { name: /back to collection/i })).toBeInTheDocument();
  });

  it('renders checkout route correctly in self-contained mode with an existing cart', async () => {
    seedCartWithPrimaryShoe();
    renderCommerceApp('/checkout');

    await screen.findByRole('heading', { name: /complete your order/i });
    expect(screen.getByText('Phantom Velocity X')).toBeInTheDocument();
    expect(screen.queryByText(/order submission is currently unavailable in this build/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /place order/i })).toBeEnabled();
  });
});
