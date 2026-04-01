import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Shoe } from '../../types';
import { CartProvider } from '../../features/cart/context/CartContext';
import Layout from '../../features/shared/ui/Layout';
import { WishlistProvider } from '../../features/wishlist/context/WishlistContext';
import CollectionPage from '../CollectionPage';

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

const buildCollectionShoe = (index: number): Shoe => ({
  id: String(index),
  name: `Collection Shoe ${String(index).padStart(2, '0')}`,
  brand: index % 2 === 0 ? 'Signal Lab' : 'Atlas',
  category: index % 3 === 0 ? 'Performance' : 'Lifestyle',
  price: 100 + index * 10,
  compareAtPrice: 130 + index * 10,
  image: `https://example.com/shoe-${index}.jpg`,
  description: `Description ${index}`,
  shortBlurb: `Blurb ${index}`,
  colorway: `Color ${index}`,
  hypeScore: 80 + index,
  accentColor: '#111111',
  modelUrl: 'https://example.com/model.glb',
  sizes: ['US 8', 'US 9'],
  materials: ['Mesh'],
  stockStatus: 'In stock',
  shippingNote: 'Ships quickly.',
  featuredNote: 'Featured.',
  isNew: index <= 4,
});

const renderCollectionRoute = () =>
  render(
    <CartProvider>
      <WishlistProvider>
        <MemoryRouter initialEntries={['/collection']}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route path="collection" element={<CollectionPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </WishlistProvider>
    </CartProvider>
  );

describe('CollectionPage', () => {
  beforeEach(() => {
    const shoes = Array.from({ length: 13 }, (_, index) => buildCollectionShoe(index + 1));
    mockedCatalogService.getAllShoes.mockResolvedValue(shoes);
    mockedCatalogService.getShoesByBrand.mockImplementation(async (brand: string) => {
      if (brand === 'All') {
        return shoes;
      }

      return shoes.filter((shoe) => shoe.brand === brand);
    });
    mockedCatalogService.getNewArrivals.mockResolvedValue(shoes.filter((shoe) => Boolean(shoe.isNew)));
    mockedCatalogService.getShoeById.mockImplementation(async (id: string) => shoes.find((shoe) => shoe.id === id));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('sorts the collection by price low to high', async () => {
    renderCollectionRoute();

    await screen.findByRole('button', { name: /open details for collection shoe 01/i });
    fireEvent.change(screen.getByLabelText(/sort by/i), { target: { value: 'price-desc' } });

    const productButtons = screen.getAllByRole('button', { name: /open details for collection shoe/i });
    expect(productButtons[0]).toHaveAttribute('aria-label', 'Open details for Collection Shoe 13');
  });

  it('paginates collection results at 12 items per page', async () => {
    renderCollectionRoute();

    await screen.findByRole('button', { name: /open details for collection shoe 01/i });
    expect(screen.getAllByRole('button', { name: /open details for collection shoe/i })).toHaveLength(12);
    expect(screen.queryByRole('button', { name: /open details for collection shoe 13/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /go to page 2/i }));

    expect(await screen.findByRole('button', { name: /open details for collection shoe 13/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /open details for collection shoe/i })).toHaveLength(1);
  });

  it('shows a clear filters action when search returns no results', async () => {
    renderCollectionRoute();

    await screen.findByRole('button', { name: /open details for collection shoe 01/i });
    fireEvent.change(screen.getByLabelText(/search catalog/i), { target: { value: 'not-a-real-match' } });

    await screen.findByText(/no styles matched your search\./i);
    fireEvent.click(screen.getByRole('button', { name: /clear filters/i }));

    expect(screen.getByLabelText(/search catalog/i)).toHaveValue('');
    expect(await screen.findByRole('button', { name: /open details for collection shoe 01/i })).toBeInTheDocument();
  });
});
