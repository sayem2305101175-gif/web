import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminDashboardPage from '../AdminDashboardPage';
import type { AdminCatalogProductSummary } from '../../shared/types';

const catalogListeners = vi.hoisted(() => new Set<() => void>());
const orderListeners = vi.hoisted(() => new Set<() => void>());
const contentListeners = vi.hoisted(() => new Set<() => void>());

const mockedCatalogService = vi.hoisted(() => ({
  listProducts: vi.fn(),
  subscribe: vi.fn((listener: () => void) => {
    catalogListeners.add(listener);
    return () => {
      catalogListeners.delete(listener);
    };
  }),
}));

const mockedOrderService = vi.hoisted(() => ({
  listOrders: vi.fn(),
  subscribe: vi.fn((listener: () => void) => {
    orderListeners.add(listener);
    return () => {
      orderListeners.delete(listener);
    };
  }),
}));

const mockedContentService = vi.hoisted(() => ({
  listSections: vi.fn(),
  getStorefrontContent: vi.fn(),
  subscribe: vi.fn((listener: () => void) => {
    contentListeners.add(listener);
    return () => {
      contentListeners.delete(listener);
    };
  }),
}));

vi.mock('../../shared/services', () => ({
  adminCatalogService: mockedCatalogService,
  adminOrderService: mockedOrderService,
  adminContentService: mockedContentService,
}));

const buildProduct = (overrides: Partial<AdminCatalogProductSummary> = {}): AdminCatalogProductSummary => ({
  id: 'prod-1',
  name: 'Atlas Pulse',
  brand: 'Northline',
  category: 'Runner',
  price: 220,
  stockStatus: 'In stock',
  publishState: 'Published',
  hasHeroImage: true,
  hasModel3d: true,
  hasShortBlurb: true,
  hasDescription: true,
  hasSizeMatrix: true,
  hasMaterialProfile: true,
  ...overrides,
});

describe('AdminDashboardPage', () => {
  const emitCatalogRefresh = async () => {
    await act(async () => {
      catalogListeners.forEach((listener) => listener());
    });
  };

  const emitOrderRefresh = async () => {
    await act(async () => {
      orderListeners.forEach((listener) => listener());
    });
  };

  const emitCatalogAndContentRefresh = async () => {
    await act(async () => {
      catalogListeners.forEach((listener) => listener());
      contentListeners.forEach((listener) => listener());
    });
  };

  beforeEach(() => {
    catalogListeners.clear();
    orderListeners.clear();
    contentListeners.clear();

    mockedCatalogService.listProducts.mockResolvedValue([
      buildProduct({ id: 'prod-1', stockStatus: 'In stock' }),
      buildProduct({ id: 'prod-2', stockStatus: 'Low stock', hasDescription: false }),
      buildProduct({ id: 'prod-3', publishState: 'Draft', stockStatus: 'Waitlist' }),
    ]);
    mockedOrderService.listOrders.mockResolvedValue([
      { id: 'order-1', status: 'Pending' },
      { id: 'order-2', status: 'Processing' },
      { id: 'order-3', status: 'Delivered' },
    ]);
    mockedContentService.listSections.mockResolvedValue([{ id: 'hero' }, { id: 'faq' }, { id: 'cta' }]);
    mockedContentService.getStorefrontContent.mockResolvedValue({ updatedAt: '2026-03-25T10:00:00.000Z' });
  });

  afterEach(() => {
    catalogListeners.clear();
    orderListeners.clear();
    contentListeners.clear();
    vi.clearAllMocks();
  });

  it('renders real operational metrics and removes placeholder dashboard copy', async () => {
    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Catalog readiness')).toBeInTheDocument();
    expect(screen.getByText('2/3')).toBeInTheDocument();
    expect(screen.getByText('Critical gaps: 1 · Warnings: 2')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3 total orders currently in operations.')).toBeInTheDocument();
    expect(screen.getByText('2 live products')).toBeInTheDocument();
    expect(screen.queryByText('0 active checks')).not.toBeInTheDocument();
    expect(screen.queryByText('0 orders pending')).not.toBeInTheDocument();
    expect(screen.queryByText('No pending changes')).not.toBeInTheDocument();
  });

  it('refreshes dashboard metrics when repository subscriptions emit updates', async () => {
    mockedCatalogService.listProducts
      .mockResolvedValueOnce([
        buildProduct({ id: 'prod-1', stockStatus: 'In stock' }),
        buildProduct({ id: 'prod-2', stockStatus: 'Low stock', hasDescription: false }),
        buildProduct({ id: 'prod-3', publishState: 'Draft', stockStatus: 'Waitlist' }),
      ])
      .mockResolvedValueOnce([
        buildProduct({ id: 'prod-1', stockStatus: 'In stock' }),
        buildProduct({ id: 'prod-2', stockStatus: 'In stock' }),
        buildProduct({ id: 'prod-3', publishState: 'Published', stockStatus: 'In stock' }),
      ]);
    mockedOrderService.listOrders
      .mockResolvedValueOnce([
        { id: 'order-1', status: 'Pending' },
        { id: 'order-2', status: 'Processing' },
        { id: 'order-3', status: 'Delivered' },
      ])
      .mockResolvedValueOnce([
        { id: 'order-1', status: 'Shipped' },
        { id: 'order-2', status: 'Delivered' },
        { id: 'order-3', status: 'Delivered' },
        { id: 'order-4', status: 'Cancelled' },
      ]);
    mockedContentService.listSections.mockResolvedValue([{ id: 'hero' }, { id: 'faq' }, { id: 'cta' }, { id: 'shipping' }]);
    mockedContentService.getStorefrontContent
      .mockResolvedValueOnce({ updatedAt: '2026-03-25T10:00:00.000Z' })
      .mockResolvedValueOnce({ updatedAt: '2026-03-25T12:00:00.000Z' });

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await screen.findByText('2/3');
    await emitCatalogRefresh();

    expect(await screen.findByText('3/3')).toBeInTheDocument();
    expect(await screen.findByText('Critical gaps: 0 · Warnings: 0')).toBeInTheDocument();
    expect(await screen.findByText('0')).toBeInTheDocument();
    expect(await screen.findByText('4 total orders currently in operations.')).toBeInTheDocument();
    expect(await screen.findByText('3 live products')).toBeInTheDocument();
  });

  it('keeps the last dashboard snapshot visible when background refresh fails', async () => {
    mockedOrderService.listOrders
      .mockResolvedValueOnce([
        { id: 'order-1', status: 'Pending' },
        { id: 'order-2', status: 'Processing' },
        { id: 'order-3', status: 'Delivered' },
      ])
      .mockRejectedValueOnce(new Error('Refresh failed'));

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await screen.findByText('2/3');
    await emitOrderRefresh();

    expect(await screen.findByText(/operational signals could not be refreshed\. showing last known snapshot\./i)).toBeInTheDocument();
    expect(screen.getByText('2/3')).toBeInTheDocument();
    expect(screen.queryByText('Operational signals unavailable.')).not.toBeInTheDocument();
  });

  it('coalesces same-tick catalog and content emits into one background refresh', async () => {
    mockedCatalogService.listProducts.mockResolvedValue([
      buildProduct({ id: 'prod-1', stockStatus: 'In stock' }),
      buildProduct({ id: 'prod-2', stockStatus: 'Low stock', hasDescription: false }),
      buildProduct({ id: 'prod-3', publishState: 'Draft', stockStatus: 'Waitlist' }),
    ]);
    mockedOrderService.listOrders.mockResolvedValue([
      { id: 'order-1', status: 'Pending' },
      { id: 'order-2', status: 'Processing' },
      { id: 'order-3', status: 'Delivered' },
    ]);
    mockedContentService.listSections.mockResolvedValue([{ id: 'hero' }, { id: 'faq' }, { id: 'cta' }]);
    mockedContentService.getStorefrontContent.mockResolvedValue({ updatedAt: '2026-03-25T10:00:00.000Z' });

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await screen.findByText('2/3');
    await emitCatalogAndContentRefresh();

    await screen.findByText('2/3');
    expect(mockedCatalogService.listProducts).toHaveBeenCalledTimes(2);
    expect(mockedOrderService.listOrders).toHaveBeenCalledTimes(2);
    expect(mockedContentService.listSections).toHaveBeenCalledTimes(2);
    expect(mockedContentService.getStorefrontContent).toHaveBeenCalledTimes(2);
  });
});
