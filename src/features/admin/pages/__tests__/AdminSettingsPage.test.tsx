import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminSettingsPage from '../AdminSettingsPage';

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

const mockedResolveCommerceRepositoryMode = vi.hoisted(() => vi.fn());

vi.mock('../../shared/services', () => ({
  adminCatalogService: mockedCatalogService,
  adminOrderService: mockedOrderService,
  adminContentService: mockedContentService,
}));

vi.mock('../../../commerce/repositories', () => ({
  resolveCommerceRepositoryMode: mockedResolveCommerceRepositoryMode,
}));

vi.mock('../../../../services/apiClient', () => ({
  isBackendConfigured: false,
}));

describe('AdminSettingsPage', () => {
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
    mockedResolveCommerceRepositoryMode.mockReturnValue('local-preview');
    mockedCatalogService.listProducts.mockResolvedValue([
      { id: 'prod-1', publishState: 'Published' },
      { id: 'prod-2', publishState: 'Draft' },
      { id: 'prod-3', publishState: 'Published' },
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

  it('shows an honest read-only operational snapshot instead of fake settings controls', async () => {
    render(
      <MemoryRouter>
        <AdminSettingsPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('No fake platform toggles live here.')).toBeInTheDocument();
    expect(screen.getByText('Local preview')).toBeInTheDocument();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
    expect(screen.getByText('2/3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open catalog' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open content' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open orders' })).toBeInTheDocument();
  });

  it('refreshes operational snapshot values in-tab when subscriptions emit updates', async () => {
    mockedCatalogService.listProducts
      .mockResolvedValueOnce([
        { id: 'prod-1', publishState: 'Published' },
        { id: 'prod-2', publishState: 'Draft' },
        { id: 'prod-3', publishState: 'Published' },
      ])
      .mockResolvedValueOnce([
        { id: 'prod-1', publishState: 'Published' },
        { id: 'prod-2', publishState: 'Published' },
        { id: 'prod-3', publishState: 'Published' },
      ]);
    mockedOrderService.listOrders
      .mockResolvedValueOnce([
        { id: 'order-1', status: 'Pending' },
        { id: 'order-2', status: 'Processing' },
        { id: 'order-3', status: 'Delivered' },
      ])
      .mockResolvedValueOnce([
        { id: 'order-1', status: 'Processing' },
        { id: 'order-2', status: 'Delivered' },
        { id: 'order-3', status: 'Delivered' },
        { id: 'order-4', status: 'Cancelled' },
      ]);
    mockedContentService.listSections.mockResolvedValue([{ id: 'hero' }, { id: 'faq' }, { id: 'cta' }]);
    mockedContentService.getStorefrontContent
      .mockResolvedValueOnce({ updatedAt: '2026-03-25T10:00:00.000Z' })
      .mockResolvedValueOnce({ updatedAt: '2026-03-25T12:00:00.000Z' });

    render(
      <MemoryRouter>
        <AdminSettingsPage />
      </MemoryRouter>
    );

    await screen.findByText('2/3');
    await emitCatalogRefresh();

    expect(await screen.findByText('3/3')).toBeInTheDocument();
    expect(await screen.findByText('4 total orders currently stored in operations.')).toBeInTheDocument();
  });

  it('keeps the last snapshot visible when a background refresh fails', async () => {
    mockedCatalogService.listProducts.mockResolvedValue([
      { id: 'prod-1', publishState: 'Published' },
      { id: 'prod-2', publishState: 'Draft' },
      { id: 'prod-3', publishState: 'Published' },
    ]);
    mockedOrderService.listOrders
      .mockResolvedValueOnce([
        { id: 'order-1', status: 'Pending' },
        { id: 'order-2', status: 'Processing' },
        { id: 'order-3', status: 'Delivered' },
      ])
      .mockRejectedValueOnce(new Error('Refresh failed'));
    mockedContentService.listSections.mockResolvedValue([{ id: 'hero' }, { id: 'faq' }, { id: 'cta' }]);
    mockedContentService.getStorefrontContent.mockResolvedValue({ updatedAt: '2026-03-25T10:00:00.000Z' });

    render(
      <MemoryRouter>
        <AdminSettingsPage />
      </MemoryRouter>
    );

    await screen.findByText('2/3');
    await emitOrderRefresh();

    expect(await screen.findByText(/operational snapshot could not be refreshed\. showing last known state\./i)).toBeInTheDocument();
    expect(screen.getByText('2/3')).toBeInTheDocument();
    expect(screen.queryByText('Operational snapshot unavailable.')).not.toBeInTheDocument();
  });

  it('coalesces same-tick catalog and content emits into one background refresh', async () => {
    mockedCatalogService.listProducts.mockResolvedValue([
      { id: 'prod-1', publishState: 'Published' },
      { id: 'prod-2', publishState: 'Draft' },
      { id: 'prod-3', publishState: 'Published' },
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
        <AdminSettingsPage />
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
