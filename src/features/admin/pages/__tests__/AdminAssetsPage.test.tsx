import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminAssetsPage from '../AdminAssetsPage';
import type { AdminCatalogProductSummary } from '../../shared/types';

const catalogListeners = vi.hoisted(() => new Set<() => void>());

const mockedCatalogService = vi.hoisted(() => ({
  listProducts: vi.fn(),
  subscribe: vi.fn((listener: () => void) => {
    catalogListeners.add(listener);
    return () => {
      catalogListeners.delete(listener);
    };
  }),
}));

vi.mock('../../shared/services', () => ({
  adminCatalogService: mockedCatalogService,
}));

const products: AdminCatalogProductSummary[] = [
  {
    id: 'prod-live-gap',
    name: 'Velocity Flux',
    brand: 'Northline',
    category: 'Runner',
    price: 220,
    stockStatus: 'In stock',
    publishState: 'Published',
    hasHeroImage: false,
    hasModel3d: true,
    hasShortBlurb: true,
    hasDescription: true,
    hasSizeMatrix: true,
    hasMaterialProfile: true,
  },
  {
    id: 'prod-draft-gap',
    name: 'Orbit Draft',
    brand: 'Northline',
    category: 'Lifestyle',
    price: 180,
    stockStatus: 'Low stock',
    publishState: 'Draft',
    hasHeroImage: true,
    hasModel3d: false,
    hasShortBlurb: true,
    hasDescription: true,
    hasSizeMatrix: true,
    hasMaterialProfile: true,
  },
  {
    id: 'prod-ready',
    name: 'Atlas Ready',
    brand: 'Northline',
    category: 'Trail',
    price: 240,
    stockStatus: 'In stock',
    publishState: 'Published',
    hasHeroImage: true,
    hasModel3d: true,
    hasShortBlurb: true,
    hasDescription: true,
    hasSizeMatrix: true,
    hasMaterialProfile: true,
  },
];

describe('AdminAssetsPage', () => {
  const emitCatalogRefresh = async () => {
    await act(async () => {
      catalogListeners.forEach((listener) => listener());
    });
  };

  beforeEach(() => {
    catalogListeners.clear();
    mockedCatalogService.listProducts.mockResolvedValue(products);
  });

  afterEach(() => {
    catalogListeners.clear();
    vi.clearAllMocks();
  });

  it('turns the assets route into a real readiness audit with actionable gaps', async () => {
    render(
      <MemoryRouter>
        <AdminAssetsPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Products missing required media')).toBeInTheDocument();
    expect(screen.getByText('1/3')).toBeInTheDocument();
    expect(screen.getByText('Velocity Flux')).toBeInTheDocument();
    expect(screen.getByText('Orbit Draft')).toBeInTheDocument();
    expect(screen.getByText('Hero image')).toBeInTheDocument();
    expect(screen.getByText('3D model')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Fix in editor' })).toHaveLength(2);
  });

  it('shows a clean all-clear state when every product has both asset types', async () => {
    mockedCatalogService.listProducts.mockResolvedValue(
      products.map((product) => ({
        ...product,
        hasHeroImage: true,
        hasModel3d: true,
      }))
    );

    render(
      <MemoryRouter>
        <AdminAssetsPage />
      </MemoryRouter>
    );

    expect(await screen.findByText(/every tracked product has media coverage/i)).toBeInTheDocument();
    expect(screen.queryByText('Products missing required media')).not.toBeInTheDocument();
  });

  it('refreshes asset readiness in-tab when the catalog repository emits updates', async () => {
    mockedCatalogService.listProducts
      .mockResolvedValueOnce(products)
      .mockResolvedValueOnce(
        products.map((product) => ({
          ...product,
          hasHeroImage: true,
          hasModel3d: true,
        }))
      );

    render(
      <MemoryRouter>
        <AdminAssetsPage />
      </MemoryRouter>
    );

    await screen.findByText('Products missing required media');
    await emitCatalogRefresh();

    expect(await screen.findByText(/every tracked product has media coverage/i)).toBeInTheDocument();
    expect(mockedCatalogService.listProducts).toHaveBeenCalledTimes(2);
  });

  it('keeps the last known snapshot visible when a background refresh fails', async () => {
    mockedCatalogService.listProducts.mockResolvedValueOnce(products).mockRejectedValueOnce(new Error('Refresh failed'));

    render(
      <MemoryRouter>
        <AdminAssetsPage />
      </MemoryRouter>
    );

    await screen.findByText('Products missing required media');
    await emitCatalogRefresh();

    expect(await screen.findByText(/asset inventory could not be refreshed\. showing last known snapshot\./i)).toBeInTheDocument();
    expect(screen.getByText('Products missing required media')).toBeInTheDocument();
    expect(screen.queryByText('Asset inventory unavailable.')).not.toBeInTheDocument();
  });
});
