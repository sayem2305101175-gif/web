import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AdminProductEditorDraft } from '../../types';

const SHARED_STORE_KEY = 'velosnak_admin_storefront_shared_v1';
const STOREFRONT_CONTENT_KEY = 'velosnak_storefront_content_v1';

const loadCatalogServices = async () => {
  vi.resetModules();
  vi.doMock('../../../../../services/apiClient', () => ({
    isBackendConfigured: false,
    apiClient: {
      get: vi.fn(),
      post: vi.fn(),
    },
    ApiError: class ApiError extends Error {
      status: number;
      responseBody: unknown;

      constructor(message: string, status: number, responseBody: unknown) {
        super(message);
        this.status = status;
        this.responseBody = responseBody;
      }
    },
  }));

  const [{ adminCatalogEditorService }, { adminCatalogService }] = await Promise.all([
    import('../adminCatalogEditorService'),
    import('../adminCatalogService'),
  ]);

  return {
    adminCatalogEditorService,
    adminCatalogService,
  };
};

const buildDraft = (id: string, overrides: Partial<AdminProductEditorDraft> = {}): AdminProductEditorDraft => ({
  id,
  name: 'Atlas Sprint 01',
  brand: 'Webshoe Labs',
  category: 'Performance',
  colorway: 'Jet / Neon',
  price: 210,
  compareAtPrice: 250,
  stockStatus: 'In stock',
  quantityOnHand: 16,
  sizes: ['US 8', 'US 9', 'US 10'],
  materials: ['Prime knit upper', 'Carbon plate'],
  shortBlurb: 'Race-ready cushioning built for confident daily speed.',
  description:
    'A durable performance silhouette with responsive cushioning, stable transitions, and breathable support for long sessions.',
  image: 'https://example.com/atlas-hero.jpg',
  modelUrl: 'https://example.com/atlas.glb',
  publishState: 'Draft',
  ...overrides,
});

describe('admin catalog persistence workflow', () => {
  beforeEach(() => {
    window.localStorage.removeItem(SHARED_STORE_KEY);
    window.localStorage.removeItem(STOREFRONT_CONTENT_KEY);
    vi.resetModules();
    vi.doUnmock('../../../../../services/apiClient');
  });

  afterEach(() => {
    window.localStorage.removeItem(SHARED_STORE_KEY);
    window.localStorage.removeItem(STOREFRONT_CONTENT_KEY);
    vi.resetModules();
    vi.doUnmock('../../../../../services/apiClient');
  });

  it('creates collision-resistant draft ids and persists new products into catalog listing', async () => {
    const { adminCatalogEditorService, adminCatalogService } = await loadCatalogServices();
    const firstDraft = adminCatalogEditorService.createEmptyDraft();
    const secondDraft = adminCatalogEditorService.createEmptyDraft();

    expect(firstDraft.id).not.toEqual(secondDraft.id);

    const newDraft = buildDraft(firstDraft.id, {
      sizes: ['US 8', ' US 8 ', 'US 9'],
      materials: ['Prime knit upper', ' Carbon plate ', 'Prime knit upper'],
    });
    const savedDraftResult = await adminCatalogEditorService.saveDraft(newDraft);

    expect(savedDraftResult.draft.sizes).toEqual(['US 8', 'US 9']);
    expect(savedDraftResult.draft.materials).toEqual(['Prime knit upper', 'Carbon plate']);

    const catalogRows = await adminCatalogService.listProducts({ search: newDraft.id });
    expect(catalogRows).toHaveLength(1);
    expect(catalogRows[0]).toMatchObject({
      id: newDraft.id,
      name: newDraft.name,
      publishState: 'Draft',
      hasModel3d: true,
      hasHeroImage: true,
    });
  });

  it('persists edited draft fields across module reload and updates catalog readiness flags from real values', async () => {
    const { adminCatalogEditorService } = await loadCatalogServices();
    const initialId = adminCatalogEditorService.createEmptyDraft().id;
    await adminCatalogEditorService.saveDraft(buildDraft(initialId));

    const degradedDraft = buildDraft(initialId, {
      shortBlurb: 'short',
      materials: [],
      image: '',
      modelUrl: '',
    });
    await adminCatalogEditorService.saveDraft(degradedDraft);

    vi.resetModules();
    const { adminCatalogEditorService: reloadedEditorService, adminCatalogService: reloadedCatalogService } =
      await loadCatalogServices();

    const persistedDraft = await reloadedEditorService.getProductDraft(initialId);
    expect(persistedDraft).not.toBeNull();
    expect(persistedDraft?.shortBlurb).toBe('short');
    expect(persistedDraft?.materials).toHaveLength(0);
    expect(persistedDraft?.image).toBe('');
    expect(persistedDraft?.modelUrl).toBe('');

    const catalogRow = (await reloadedCatalogService.listProducts({ search: initialId }))[0];
    expect(catalogRow).toBeDefined();
    expect(catalogRow?.hasShortBlurb).toBe(false);
    expect(catalogRow?.hasMaterialProfile).toBe(false);
    expect(catalogRow?.hasHeroImage).toBe(false);
    expect(catalogRow?.hasModel3d).toBe(false);
  });

  it('keeps publish and unpublish state durable across reload', async () => {
    const { adminCatalogEditorService, adminCatalogService } = await loadCatalogServices();
    const draftId = adminCatalogEditorService.createEmptyDraft().id;
    const savedDraft = buildDraft(draftId);
    await adminCatalogEditorService.saveDraft(savedDraft);
    await adminCatalogEditorService.publishDraft(savedDraft);

    const publishedListRows = await adminCatalogService.listProducts({ publishState: 'Published', search: draftId });
    expect(publishedListRows.some((row) => row.id === draftId)).toBe(true);

    vi.resetModules();
    const { adminCatalogEditorService: reloadedEditorService } = await loadCatalogServices();
    const publishedDraft = await reloadedEditorService.getProductDraft(draftId);
    expect(publishedDraft?.publishState).toBe('Published');
    if (!publishedDraft) {
      throw new Error('Expected draft to exist after publish step.');
    }

    await reloadedEditorService.unpublishDraft({
      ...publishedDraft,
      publishState: 'Published',
    });

    vi.resetModules();
    const { adminCatalogEditorService: finalEditorService, adminCatalogService: finalCatalogService } =
      await loadCatalogServices();
    const unpublishedDraft = await finalEditorService.getProductDraft(draftId);
    expect(unpublishedDraft?.publishState).toBe('Draft');

    const publishedRowsAfterUnpublish = await finalCatalogService.listProducts({ publishState: 'Published', search: draftId });
    expect(publishedRowsAfterUnpublish.some((row) => row.id === draftId)).toBe(false);
  });
});
