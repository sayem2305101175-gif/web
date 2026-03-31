import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AdminCatalogEditorPage from '../AdminCatalogEditorPage';
import type { AdminProductEditorDraft } from '../../shared/types';

const mockedCatalogEditorService = vi.hoisted(() => ({
  createEmptyDraft: vi.fn(),
  getProductDraft: vi.fn(),
  saveDraft: vi.fn(),
  publishDraft: vi.fn(),
  unpublishDraft: vi.fn(),
}));

vi.mock('../../shared/services', () => ({
  adminCatalogEditorService: mockedCatalogEditorService,
}));

const buildDraft = (overrides: Partial<AdminProductEditorDraft> = {}): AdminProductEditorDraft => ({
  id: '1',
  name: 'Phantom Velocity X',
  brand: 'VeloSnak Elite',
  category: 'Performance',
  colorway: 'Midnight / Cyan Spark',
  price: 295,
  compareAtPrice: 340,
  stockStatus: 'In stock',
  quantityOnHand: 20,
  sizes: ['US 8', 'US 9'],
  materials: ['Prime-knit upper'],
  shortBlurb: 'Reliable comfort for daily rotation.',
  description: 'A premium runner with stable cushioning and confident grip for all-day wear.',
  image: 'https://example.com/hero.jpg',
  modelUrl: 'https://example.com/model.glb',
  publishState: 'Draft',
  ...overrides,
});

const renderEditor = (initialEntries: Array<string | { pathname: string; state?: unknown }> = ['/admin/catalog/1/edit']) =>
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/admin/catalog/new" element={<AdminCatalogEditorPage />} />
        <Route path="/admin/catalog/:productId/edit" element={<AdminCatalogEditorPage />} />
        <Route path="/admin/catalog" element={<div>Catalog Route</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('AdminCatalogEditorPage', () => {
  beforeEach(() => {
    mockedCatalogEditorService.createEmptyDraft.mockReturnValue(buildDraft({
      id: 'new-draft',
      name: '',
      brand: '',
      category: '',
      colorway: '',
      price: 0,
      compareAtPrice: 0,
      sizes: [],
      materials: [],
      shortBlurb: '',
      description: '',
      image: '',
      modelUrl: '',
    }));
    mockedCatalogEditorService.getProductDraft.mockResolvedValue(buildDraft());
    mockedCatalogEditorService.saveDraft.mockResolvedValue({
      savedAt: '2026-03-25T08:00:00.000Z',
      draft: buildDraft(),
    });
    mockedCatalogEditorService.publishDraft.mockResolvedValue({
      publishedAt: '2026-03-25T08:05:00.000Z',
      draft: buildDraft({ publishState: 'Published' }),
    });
    mockedCatalogEditorService.unpublishDraft.mockResolvedValue({
      unpublishedAt: '2026-03-25T08:10:00.000Z',
      draft: buildDraft({ publishState: 'Draft' }),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('publishes a valid draft from the editor workflow', async () => {
    renderEditor();

    await screen.findByText(/draft id: 1/i);
    fireEvent.click(screen.getByRole('button', { name: /^publish$/i }));

    await waitFor(() => {
      expect(mockedCatalogEditorService.publishDraft).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText(/product published at/i)).toBeInTheDocument();
    expect(screen.getByText(/visible on storefront routes/i)).toBeInTheDocument();
  });

  it('blocks publishing when publish-readiness has blocking issues', async () => {
    mockedCatalogEditorService.getProductDraft.mockResolvedValueOnce(buildDraft({ modelUrl: '' }));
    renderEditor();

    await screen.findByText(/draft id: 1/i);
    fireEvent.click(screen.getByRole('button', { name: /^publish$/i }));

    expect(mockedCatalogEditorService.publishDraft).not.toHaveBeenCalled();
    expect(await screen.findByText(/cannot publish/i)).toBeInTheDocument();
  });

  it('shows draft setup guidance on a fresh create route', async () => {
    renderEditor(['/admin/catalog/new']);

    await screen.findByText(/draft id: new-draft/i);
    expect(
      screen.getByText(/new drafts start off-storefront\. save whenever you want, then publish once the required fields and media checks are complete\./i)
    ).toBeInTheDocument();
    expect(screen.getAllByText('Not started').length).toBeGreaterThan(0);
    expect(screen.getByText('Draft setup')).toBeInTheDocument();
  });

  it('shows the duplicate handoff notice when arriving from the catalog list', async () => {
    renderEditor([
      {
        pathname: '/admin/catalog/1/edit',
        state: {
          catalogEditorNotice: {
            message: 'Duplicated "Phantom Velocity X" at 8:00 AM. The new copy opened as a draft.',
            tone: 'success',
          },
        },
      },
    ]);

    await screen.findByText(/draft id: 1/i);
    expect(await screen.findByText(/the new copy opened as a draft/i)).toBeInTheDocument();
  });

  it('protects unsaved changes before leaving the editor route', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
    renderEditor();

    await screen.findByText(/draft id: 1/i);
    fireEvent.change(screen.getByLabelText(/product name/i), {
      target: { value: 'Phantom Velocity X Mark II' },
    });

    fireEvent.click(screen.getByRole('button', { name: /back to catalog/i }));
    expect(confirmSpy).toHaveBeenCalledWith('You have unsaved changes. Leave editor anyway?');
    expect(screen.queryByText('Catalog Route')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /back to catalog/i }));
    expect(await screen.findByText('Catalog Route')).toBeInTheDocument();
  });
});
