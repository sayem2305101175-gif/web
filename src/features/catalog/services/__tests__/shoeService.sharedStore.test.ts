import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AdminProductEditorDraft } from '../../../admin/shared/types';
import type { Shoe } from '../../../../types';

const SHARED_STORE_KEY = 'velosnak_admin_storefront_shared_v1';
const STOREFRONT_CONTENT_KEY = 'velosnak_storefront_content_v1';

const buildDraft = (id: string, overrides: Partial<AdminProductEditorDraft> = {}): AdminProductEditorDraft => ({
  id,
  name: 'Storefront Relay X',
  brand: 'Signal Lab',
  category: 'Performance',
  colorway: 'Black / Volt',
  price: 230,
  compareAtPrice: 270,
  stockStatus: 'In stock',
  quantityOnHand: 12,
  sizes: ['US 8', 'US 9', 'US 10'],
  materials: ['Prime knit upper', 'Foam carrier'],
  shortBlurb: 'Responsive and stable for high-tempo sessions.',
  description:
    'A route-ready silhouette tuned for responsive acceleration, breathable comfort, and stable transitions across long sessions.',
  image: 'https://example.com/relay-hero.jpg',
  modelUrl: 'https://example.com/relay.glb',
  publishState: 'Draft',
  ...overrides,
});

type BackendPublishState = 'Draft' | 'Published' | 'Archived';
type BackendShoe = Shoe & { publishState?: BackendPublishState };

const buildBackendShoe = (id: string, publishState: BackendPublishState, overrides: Partial<BackendShoe> = {}): BackendShoe => ({
  id,
  name: `Backend ${id}`,
  brand: 'Signal Lab',
  category: 'Performance',
  price: 230,
  compareAtPrice: 270,
  image: 'https://example.com/relay-hero.jpg',
  description: 'Backend catalog shoe for publish-state storefront visibility tests.',
  shortBlurb: 'Backend shoe',
  colorway: 'Black / Volt',
  hypeScore: 90,
  accentColor: '#111827',
  modelUrl: 'https://example.com/relay.glb',
  sizes: ['US 8', 'US 9', 'US 10'],
  materials: ['Prime knit upper', 'Foam carrier'],
  stockStatus: 'In stock',
  shippingNote: 'Ships in 24 hours',
  featuredNote: 'Featured backend note',
  isNew: true,
  publishState,
  ...overrides,
});

const loadLocalPreviewServices = async () => {
  vi.resetModules();
  vi.doMock('../../../../services/apiClient', () => ({
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

  const [{ shoeService }, { adminCatalogEditorService }] = await Promise.all([
    import('../shoeService'),
    import('../../../admin/shared/services/adminCatalogEditorService'),
  ]);

  return {
    shoeService,
    adminCatalogEditorService,
  };
};

const loadBackendServices = async (apiGet: ReturnType<typeof vi.fn>) => {
  vi.resetModules();
  vi.doMock('../../../../services/apiClient', () => ({
    isBackendConfigured: true,
    apiClient: {
      get: apiGet,
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

  const { shoeService } = await import('../shoeService');
  return { shoeService };
};

describe('shoeService shared-store storefront reads', () => {
  beforeEach(() => {
    window.localStorage.removeItem(SHARED_STORE_KEY);
    window.localStorage.removeItem(STOREFRONT_CONTENT_KEY);
    vi.resetModules();
    vi.doUnmock('../../../../services/apiClient');
  });

  afterEach(() => {
    window.localStorage.removeItem(SHARED_STORE_KEY);
    window.localStorage.removeItem(STOREFRONT_CONTENT_KEY);
    vi.resetModules();
    vi.doUnmock('../../../../services/apiClient');
  });

  it('shows only published products for storefront catalog and detail reads', async () => {
    const { shoeService } = await loadLocalPreviewServices();
    const shoes = await shoeService.getAllShoes();
    const ids = shoes.map((shoe) => shoe.id);

    expect(ids).toEqual(['1', '3', '4', '8']);
    expect(await shoeService.getShoeById('2')).toBeUndefined();
    expect(await shoeService.getShoeById('5')).toBeUndefined();
    expect(await shoeService.getShoeById('1')).toBeDefined();
  });

  it('keeps storefront catalog/detail in sync with admin publish and unpublish', async () => {
    const { shoeService, adminCatalogEditorService } = await loadLocalPreviewServices();
    const draftId = adminCatalogEditorService.createEmptyDraft().id;
    const draft = buildDraft(draftId);

    await adminCatalogEditorService.saveDraft(draft);
    expect(await shoeService.getShoeById(draftId)).toBeUndefined();

    await adminCatalogEditorService.publishDraft(draft);
    const publishedShoe = await shoeService.getShoeById(draftId);
    expect(publishedShoe).toBeDefined();

    const catalogAfterPublish = await shoeService.getAllShoes();
    expect(catalogAfterPublish.some((shoe) => shoe.id === draftId)).toBe(true);

    await adminCatalogEditorService.unpublishDraft({ ...draft, publishState: 'Published' });
    expect(await shoeService.getShoeById(draftId)).toBeUndefined();
    const catalogAfterUnpublish = await shoeService.getAllShoes();
    expect(catalogAfterUnpublish.some((shoe) => shoe.id === draftId)).toBe(false);
  });

  it('applies storefront visibility rules to backend catalog responses when publishState is provided', async () => {
    const backendCatalog = [
      buildBackendShoe('published-1', 'Published', { isNew: true }),
      buildBackendShoe('draft-1', 'Draft', { isNew: true }),
      buildBackendShoe('archived-1', 'Archived', { isNew: true }),
    ];

    const apiGet = vi
      .fn()
      .mockResolvedValueOnce(backendCatalog)
      .mockResolvedValueOnce(backendCatalog.find((shoe) => shoe.id === 'draft-1'))
      .mockResolvedValueOnce(backendCatalog.find((shoe) => shoe.id === 'published-1'))
      .mockResolvedValueOnce(backendCatalog)
      .mockResolvedValueOnce(backendCatalog)
      .mockResolvedValueOnce(backendCatalog.find((shoe) => shoe.id === 'published-1'))
      .mockResolvedValueOnce(backendCatalog);

    const { shoeService } = await loadBackendServices(apiGet);

    const allShoes = await shoeService.getAllShoes();
    expect(allShoes.map((shoe) => shoe.id)).toEqual(['published-1']);

    const draftDetail = await shoeService.getShoeById('draft-1');
    expect(draftDetail).toBeUndefined();

    const publishedDetail = await shoeService.getShoeById('published-1');
    expect(publishedDetail?.id).toBe('published-1');

    const allBrandShoes = await shoeService.getShoesByBrand('All');
    expect(allBrandShoes.map((shoe) => shoe.id)).toEqual(['published-1']);

    const newArrivals = await shoeService.getNewArrivals();
    expect(newArrivals.map((shoe) => shoe.id)).toEqual(['published-1']);

    const featuredProduct = await shoeService.getFeaturedMerchandisingShoeById('published-1');
    expect(featuredProduct?.id).toBe('published-1');

    const featuredFallback = await shoeService.getFeaturedMerchandisingFallbackShoe();
    expect(featuredFallback?.id).toBe('published-1');
  });
});
