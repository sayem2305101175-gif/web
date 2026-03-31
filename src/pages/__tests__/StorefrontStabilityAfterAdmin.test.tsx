import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SHOES } from '../../constants';
import { CartProvider } from '../../features/cart/context/CartContext';
import Home from '../Home';
import { WishlistProvider } from '../../features/wishlist/context/WishlistContext';

const mockedCatalogService = vi.hoisted(() => ({
  getAllShoes: vi.fn(),
  getFeaturedMerchandisingFallbackShoe: vi.fn(),
  getFeaturedMerchandisingShoeById: vi.fn(),
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

describe('Storefront stability after admin introduction', () => {
  beforeEach(() => {
    mockedCatalogService.getShoesByBrand.mockResolvedValue([...SHOES]);
    mockedCatalogService.getShoeById.mockImplementation(async (id: string) =>
      SHOES.find((shoe) => shoe.id === id)
    );
    mockedCatalogService.getFeaturedMerchandisingShoeById.mockImplementation(async (id: string) =>
      SHOES.find((shoe) => shoe.id === id)
    );
    mockedCatalogService.getFeaturedMerchandisingFallbackShoe.mockResolvedValue(SHOES[0] ?? null);
    mockedCatalogService.getAllShoes.mockResolvedValue([...SHOES]);
    mockedCatalogService.getNewArrivals.mockResolvedValue(SHOES.filter((shoe) => Boolean(shoe.isNew)));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('keeps homepage catalog rendering 3D-first product cards', async () => {
    const { container } = render(
      <CartProvider>
        <WishlistProvider>
          <MemoryRouter>
            <Home />
          </MemoryRouter>
        </WishlistProvider>
      </CartProvider>
    );

    await waitFor(() => {
      expect(container.querySelectorAll('model-viewer').length).toBeGreaterThan(0);
    });
  });
});
