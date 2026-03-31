import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AdminCatalogPage from '../AdminCatalogPage';
import type { AdminCatalogProductSummary } from '../../shared/types';

const mockedCatalogService = vi.hoisted(() => ({
  listProducts: vi.fn(),
}));

const mockedCatalogEditorService = vi.hoisted(() => ({
  duplicateProduct: vi.fn(),
  archiveProduct: vi.fn(),
  unpublishProduct: vi.fn(),
}));

vi.mock('../../shared/services', () => ({
  adminCatalogService: mockedCatalogService,
  adminCatalogEditorService: mockedCatalogEditorService,
}));

const basePublishedProduct: AdminCatalogProductSummary = {
  id: 'prod-1',
  name: 'Step10 Prime',
  brand: 'Step10 Labs',
  category: 'Performance',
  price: 249,
  stockStatus: 'In stock',
  publishState: 'Published',
  hasHeroImage: true,
  hasModel3d: true,
  hasShortBlurb: true,
  hasDescription: true,
  hasSizeMatrix: true,
  hasMaterialProfile: true,
};

const baseDraftProduct: AdminCatalogProductSummary = {
  ...basePublishedProduct,
  id: 'prod-2',
  name: 'Archive Target',
  publishState: 'Draft',
};

const renderCatalogPage = () =>
  render(
    <MemoryRouter initialEntries={['/admin/catalog']}>
      <Routes>
        <Route path="/admin/catalog" element={<AdminCatalogPage />} />
        <Route path="/admin/catalog/:productId/edit" element={<div>Catalog Editor Route</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('AdminCatalogPage', () => {
  beforeEach(() => {
    mockedCatalogService.listProducts.mockResolvedValue([basePublishedProduct, baseDraftProduct]);
    mockedCatalogEditorService.duplicateProduct.mockResolvedValue({
      productId: 'prod-copy',
      duplicatedAt: '2026-03-25T08:00:00.000Z',
    });
    mockedCatalogEditorService.archiveProduct.mockResolvedValue({
      archivedAt: '2026-03-25T08:05:00.000Z',
    });
    mockedCatalogEditorService.unpublishProduct.mockResolvedValue({
      unpublishedAt: '2026-03-25T08:10:00.000Z',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('unpublishes a published product from the catalog list with a real mutation path', async () => {
    mockedCatalogService.listProducts
      .mockResolvedValueOnce([basePublishedProduct, baseDraftProduct])
      .mockResolvedValueOnce([{ ...basePublishedProduct, publishState: 'Draft' }, baseDraftProduct]);

    renderCatalogPage();

    await screen.findByText('Step10 Prime');
    fireEvent.click(screen.getAllByRole('button', { name: 'Unpublish' })[0]!);
    fireEvent.click(await screen.findByRole('button', { name: 'Unpublish product' }));

    await waitFor(() => {
      expect(mockedCatalogEditorService.unpublishProduct).toHaveBeenCalledWith('prod-1');
    });
    expect(await screen.findByText(/unpublished "step10 prime" at/i)).toBeInTheDocument();
    expect(screen.getByText(/removed from storefront visibility/i)).toBeInTheDocument();
    expect(mockedCatalogService.listProducts).toHaveBeenCalledTimes(2);
    expect(await screen.findByText('ID prod-1')).toBeInTheDocument();
    expect(screen.getAllByText('Draft').length).toBeGreaterThan(1);
  });

  it('archives a non-published product from the catalog list with a real mutation path', async () => {
    mockedCatalogService.listProducts
      .mockResolvedValueOnce([basePublishedProduct, baseDraftProduct])
      .mockResolvedValueOnce([basePublishedProduct, { ...baseDraftProduct, publishState: 'Archived' }]);

    renderCatalogPage();

    await screen.findByText('Archive Target');
    fireEvent.click(screen.getAllByRole('button', { name: 'Archive' })[0]!);
    fireEvent.click(await screen.findByRole('button', { name: 'Archive product' }));

    await waitFor(() => {
      expect(mockedCatalogEditorService.archiveProduct).toHaveBeenCalledWith('prod-2');
    });
    expect(await screen.findByText(/archived "archive target" at/i)).toBeInTheDocument();
    expect(screen.getByText(/out of active storefront assortment/i)).toBeInTheDocument();
    expect(mockedCatalogService.listProducts).toHaveBeenCalledTimes(2);
  });

  it('duplicates a product and opens the new draft in the editor', async () => {
    mockedCatalogService.listProducts
      .mockResolvedValueOnce([basePublishedProduct, baseDraftProduct])
      .mockResolvedValueOnce([basePublishedProduct, baseDraftProduct, { ...basePublishedProduct, id: 'prod-copy', name: 'Step10 Prime Copy', publishState: 'Draft' }]);

    renderCatalogPage();

    await screen.findByText('Step10 Prime');
    fireEvent.click(screen.getAllByRole('button', { name: 'Duplicate' })[0]!);
    fireEvent.click(await screen.findByRole('button', { name: /confirm duplicate/i }));

    await waitFor(() => {
      expect(mockedCatalogEditorService.duplicateProduct).toHaveBeenCalledWith('prod-1');
    });
    expect(await screen.findByText('Catalog Editor Route')).toBeInTheDocument();
  });
});
