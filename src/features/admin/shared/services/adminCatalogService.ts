import { commerceRepositories } from '../../../commerce/repositories';
import type { AdminCatalogProductSummary, AdminPublishState } from '../types/admin';

export interface AdminCatalogQuery {
  search?: string;
  category?: string;
  publishState?: AdminPublishState | 'All';
  stockStatus?: AdminCatalogProductSummary['stockStatus'] | 'All';
}

const toCatalogSummary = (product: {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  stockStatus: AdminCatalogProductSummary['stockStatus'];
  publishState: AdminPublishState;
  shortBlurb: string;
  description: string;
  sizes: string[];
  materials: string[];
  image: string;
  modelUrl: string;
}): AdminCatalogProductSummary => ({
  id: product.id,
  name: product.name,
  brand: product.brand,
  category: product.category,
  price: product.price,
  stockStatus: product.stockStatus,
  publishState: product.publishState,
  hasHeroImage: product.image.trim().length > 0,
  hasModel3d: product.modelUrl.trim().length > 0,
  hasShortBlurb: product.shortBlurb.trim().length >= 10,
  hasDescription: product.description.trim().length >= 40,
  hasSizeMatrix: product.sizes.length > 0,
  hasMaterialProfile: product.materials.length > 0,
});

export const adminCatalogService = {
  async listProducts(query?: AdminCatalogQuery): Promise<AdminCatalogProductSummary[]> {
    const catalogProducts = (await commerceRepositories.catalog.listProducts({ ...query, surface: 'admin' })).map((product) =>
      toCatalogSummary({
        id: product.id,
        name: product.name,
        brand: product.brand,
        category: product.category,
        price: product.price,
        stockStatus: product.stockStatus,
        publishState: product.publishState,
        shortBlurb: product.shortBlurb,
        description: product.description,
        sizes: product.sizes,
        materials: product.materials,
        image: product.image,
        modelUrl: product.modelUrl,
      })
    );
    return catalogProducts;
  },

  subscribe(listener: () => void): () => void {
    return commerceRepositories.catalog.subscribe?.(listener) ?? (() => undefined);
  },
};
