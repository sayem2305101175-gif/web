import { commerceRepositories, createCommerceDraftProductId } from '../../../commerce/repositories';
import type { AdminProductEditorDraft, SharedProductRecord } from '../types';

const sleep = (durationMs: number) => new Promise((resolve) => window.setTimeout(resolve, durationMs));
const adminCatalogSurface = { surface: 'admin' as const };

const quantityByStockStatus: Record<AdminProductEditorDraft['stockStatus'], number> = {
  'In stock': 36,
  'Low stock': 7,
  Waitlist: 0,
};

const resolveDefaultShippingNote = (stockStatus: AdminProductEditorDraft['stockStatus']) => {
  if (stockStatus === 'In stock') {
    return 'Ships within 24 hours.';
  }
  if (stockStatus === 'Low stock') {
    return 'Low-stock sizes ship within 48 hours.';
  }
  return 'The next batch ships next week.';
};

const resolveDefaultFeaturedNote = (draft: AdminProductEditorDraft) => {
  if (draft.shortBlurb.trim().length > 0) {
    return draft.shortBlurb.trim();
  }
  if (draft.description.trim().length > 0) {
    return draft.description.trim().slice(0, 120);
  }
  return 'Limited release pair ready for next merchandising cycle.';
};

const normalizeList = (items: string[]) =>
  items
    .map((item) => item.trim())
    .filter((item, index, list) => item.length > 0 && list.indexOf(item) === index);

const toEditorDraft = (product: SharedProductRecord): AdminProductEditorDraft => ({
  id: product.id,
  name: product.name,
  brand: product.brand,
  category: product.category,
  colorway: product.colorway,
  price: product.price,
  compareAtPrice: product.compareAtPrice,
  stockStatus: product.stockStatus,
  quantityOnHand: product.quantityOnHand,
  sizes: [...product.sizes],
  materials: [...product.materials],
  shortBlurb: product.shortBlurb,
  description: product.description,
  image: product.image,
  modelUrl: product.modelUrl,
  publishState: product.publishState,
});

const toProductRecord = (
  draft: AdminProductEditorDraft,
  options?: { existingProduct: SharedProductRecord | null; nextPublishState?: SharedProductRecord['publishState'] }
): SharedProductRecord => {
  const now = new Date().toISOString();
  const existingProduct = options?.existingProduct ?? null;
  const nextPublishState = options?.nextPublishState ?? draft.publishState;

  return {
    id: draft.id,
    name: draft.name.trim(),
    brand: draft.brand.trim(),
    category: draft.category.trim(),
    colorway: draft.colorway.trim(),
    price: draft.price,
    compareAtPrice: draft.compareAtPrice,
    stockStatus: draft.stockStatus,
    quantityOnHand: draft.quantityOnHand,
    sizes: normalizeList(draft.sizes),
    materials: normalizeList(draft.materials),
    shortBlurb: draft.shortBlurb.trim(),
    description: draft.description.trim(),
    image: draft.image.trim(),
    modelUrl: draft.modelUrl.trim(),
    shippingNote: existingProduct?.shippingNote ?? resolveDefaultShippingNote(draft.stockStatus),
    featuredNote: existingProduct?.featuredNote ?? resolveDefaultFeaturedNote(draft),
    accentColor: existingProduct?.accentColor ?? '#d4af37',
    hypeScore: existingProduct?.hypeScore ?? 80,
    isNew: existingProduct?.isNew ?? true,
    publishState: nextPublishState,
    updatedAt: now,
  };
};

const createEmptyDraft = (): AdminProductEditorDraft => ({
  id: createCommerceDraftProductId(),
  name: '',
  brand: '',
  category: '',
  colorway: '',
  price: 0,
  compareAtPrice: 0,
  stockStatus: 'In stock',
  quantityOnHand: quantityByStockStatus['In stock'],
  sizes: [],
  materials: [],
  shortBlurb: '',
  description: '',
  image: '',
  modelUrl: '',
  publishState: 'Draft',
});

const saveProductFromDraft = (
  draft: AdminProductEditorDraft,
  options?: { nextPublishState?: SharedProductRecord['publishState'] }
) =>
  (async () => {
    const existingProduct = await commerceRepositories.catalog.getProductById(draft.id, adminCatalogSurface);
    const nextRecord = toProductRecord(draft, {
      existingProduct,
      nextPublishState: options?.nextPublishState,
    });
    return commerceRepositories.catalog.saveProduct(nextRecord);
  })();

const mutateProductPublishState = async (
  productId: string,
  nextPublishState: SharedProductRecord['publishState']
) => {
  if (commerceRepositories.catalog.setPublishState) {
    return commerceRepositories.catalog.setPublishState(productId, nextPublishState);
  }

  const existingProduct = await commerceRepositories.catalog.getProductById(productId, adminCatalogSurface);
  if (!existingProduct) {
    return null;
  }

  return commerceRepositories.catalog.saveProduct({
    ...existingProduct,
    publishState: nextPublishState,
    updatedAt: new Date().toISOString(),
  });
};

export const adminCatalogEditorService = {
  createEmptyDraft,

  async getProductDraft(productId: string): Promise<AdminProductEditorDraft | null> {
    await sleep(180);
    const product = await commerceRepositories.catalog.getProductById(productId, adminCatalogSurface);
    return product ? toEditorDraft(product) : null;
  },

  async saveDraft(draft: AdminProductEditorDraft): Promise<{ savedAt: string; draft: AdminProductEditorDraft }> {
    await sleep(220);
    const savedProduct = await saveProductFromDraft(draft, { nextPublishState: draft.publishState });
    return {
      savedAt: savedProduct.updatedAt ?? new Date().toISOString(),
      draft: toEditorDraft(savedProduct),
    };
  },

  async publishDraft(draft: AdminProductEditorDraft): Promise<{ publishedAt: string; draft: AdminProductEditorDraft }> {
    await sleep(240);
    const publishedProduct = await saveProductFromDraft(draft, { nextPublishState: 'Published' });
    return {
      publishedAt: publishedProduct.updatedAt ?? new Date().toISOString(),
      draft: toEditorDraft(publishedProduct),
    };
  },

  async unpublishDraft(
    draft: AdminProductEditorDraft
  ): Promise<{ unpublishedAt: string; draft: AdminProductEditorDraft }> {
    await sleep(200);
    const unpublishedProduct = await saveProductFromDraft(draft, { nextPublishState: 'Draft' });
    return {
      unpublishedAt: unpublishedProduct.updatedAt ?? new Date().toISOString(),
      draft: toEditorDraft(unpublishedProduct),
    };
  },

  async duplicateProduct(productId: string): Promise<{ productId: string; duplicatedAt: string } | null> {
    await sleep(220);
    if (commerceRepositories.catalog.duplicateProduct) {
      const duplicatedProduct = await commerceRepositories.catalog.duplicateProduct(productId);
      if (!duplicatedProduct) {
        return null;
      }

      return {
        productId: duplicatedProduct.id,
        duplicatedAt: duplicatedProduct.updatedAt ?? new Date().toISOString(),
      };
    }

    const existingProduct = await commerceRepositories.catalog.getProductById(productId, adminCatalogSurface);
    if (!existingProduct) {
      return null;
    }

    const duplicatedDraft = toEditorDraft(existingProduct);
    const duplicatedProduct = await saveProductFromDraft({
      ...duplicatedDraft,
      id: createCommerceDraftProductId(),
      name: `${existingProduct.name} Copy`,
      publishState: 'Draft',
    });

    return {
      productId: duplicatedProduct.id,
      duplicatedAt: duplicatedProduct.updatedAt ?? new Date().toISOString(),
    };
  },

  async archiveProduct(productId: string): Promise<{ archivedAt: string } | null> {
    await sleep(200);
    const archivedProduct = await mutateProductPublishState(productId, 'Archived');
    if (!archivedProduct) {
      return null;
    }

    return { archivedAt: archivedProduct.updatedAt ?? new Date().toISOString() };
  },

  async unpublishProduct(productId: string): Promise<{ unpublishedAt: string } | null> {
    await sleep(200);
    const unpublishedProduct = await mutateProductPublishState(productId, 'Draft');
    if (!unpublishedProduct) {
      return null;
    }

    return { unpublishedAt: unpublishedProduct.updatedAt ?? new Date().toISOString() };
  },
};
