import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SHOES } from '../../constants';
import { CartProvider } from '../../features/cart/context/CartContext';
import { ToastProvider } from '../../features/shared/context/ToastContext';
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
        <ToastProvider>
          <MemoryRouter initialEntries={[`/product/${encodeURIComponent(productId)}`]}>
            <Routes>
              <Route path="/product/:productId" element={<ProductDetailPage />} />
            </Routes>
          </MemoryRouter>
        </ToastProvider>
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
    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
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

  it('renders breadcrumb and reviews placeholder content', async () => {
    renderProductDetailRoute(primaryShoe.id);

    await screen.findByText(new RegExp(`product id: ${primaryShoe.id}`, 'i'));
    const breadcrumb = screen.getByRole('navigation', { name: /breadcrumb/i });
    expect(within(breadcrumb).getByRole('link', { name: /^home$/i })).toHaveAttribute('href', '/');
    expect(within(breadcrumb).getByRole('link', { name: /^collection$/i })).toHaveAttribute('href', '/collection');
    expect(screen.getByRole('heading', { name: /no reviews yet/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /write a review/i })).toBeDisabled();
  });

  it('opens the image zoom lightbox and closes it on escape', async () => {
    renderProductDetailRoute(primaryShoe.id);

    await screen.findByText(new RegExp(`product id: ${primaryShoe.id}`, 'i'));
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`open zoom view for ${primaryShoe.name}`, 'i') }));

    expect(await screen.findByRole('dialog', { name: primaryShoe.name })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog', { name: primaryShoe.name })).not.toBeInTheDocument();
  });

  it('prioritizes same-brand related products before other matches', async () => {
    const sameBrandAlt = {
      ...SHOES[3],
      id: 'same-brand-priority',
      name: 'Aardvark Velocity',
      brand: primaryShoe.brand,
      category: 'Travel',
    };
    const sameCategoryOnly = {
      ...SHOES[4],
      id: 'same-category-only',
      name: 'Zulu Performance',
      brand: 'Outside Label',
      category: primaryShoe.category,
    };
    const unrelated = {
      ...SHOES[5],
      id: 'unrelated-fallback',
      name: 'Midway Drift',
      brand: 'Another House',
      category: 'Outdoor',
    };

    mockedCatalogService.getAllShoes.mockResolvedValueOnce([primaryShoe, sameCategoryOnly, unrelated, sameBrandAlt]);

    renderProductDetailRoute(primaryShoe.id);

    await screen.findByText(new RegExp(`product id: ${primaryShoe.id}`, 'i'));
    const relatedLinks = screen.getAllByRole('link').filter((element) =>
      element.getAttribute('href')?.startsWith('/product/')
    );

    expect(relatedLinks[0]).toHaveAttribute('href', '/product/same-brand-priority');
    expect(relatedLinks[1]).toHaveAttribute('href', '/product/same-category-only');
  });

  it('shows add-to-bag, copy-link, and wishlist toasts', async () => {
    renderProductDetailRoute(primaryShoe.id);

    await screen.findByText(new RegExp(`product id: ${primaryShoe.id}`, 'i'));

    fireEvent.click(screen.getByRole('button', { name: /copy link/i }));
    expect(await screen.findByRole('status')).toHaveTextContent(/link copied/i);

    fireEvent.click(screen.getByRole('button', { name: /add us 7 to bag/i }));
    expect(screen.getByRole('status')).toHaveTextContent(/added to bag/i);

    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(screen.getByRole('status')).toHaveTextContent(/^saved$/i);

    fireEvent.click(screen.getByRole('button', { name: /^saved$/i }));
    expect(screen.getByRole('status')).toHaveTextContent(/^removed$/i);

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 3100));
    });

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  }, 10000);
});
