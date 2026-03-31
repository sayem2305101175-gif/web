import { ApiError, apiClient } from '../../../../services/apiClient';
import type { SharedProductRecord } from '../../../admin/shared/types';
import type { CatalogRepository, CatalogRepositorySurface } from '../contracts';
import { matchesCatalogQuery } from '../catalogQuery';
import type { BackendAdminCatalogRecordDto, BackendCatalogShoe } from './contracts';
import { localPreviewCatalogRepository } from '../localPreview';

type BackendCatalogRecordDto = BackendCatalogShoe | BackendAdminCatalogRecordDto;

const DEFAULT_SURFACE: CatalogRepositorySurface = 'admin';

const toSharedProductRecord = (shoe: BackendCatalogRecordDto): SharedProductRecord => ({
  id: shoe.id,
  name: shoe.name,
  brand: shoe.brand,
  category: shoe.category,
  colorway: shoe.colorway,
  price: shoe.price,
  compareAtPrice: shoe.compareAtPrice ?? 0,
  stockStatus: shoe.stockStatus,
  quantityOnHand: 'quantityOnHand' in shoe ? shoe.quantityOnHand : 0,
  sizes: [...shoe.sizes],
  materials: [...shoe.materials],
  shortBlurb: shoe.shortBlurb,
  description: shoe.description,
  image: shoe.image,
  modelUrl: shoe.modelUrl,
  shippingNote: shoe.shippingNote,
  featuredNote: shoe.featuredNote,
  accentColor: shoe.accentColor,
  hypeScore: shoe.hypeScore,
  isNew: Boolean(shoe.isNew),
  publishState: shoe.publishState ?? 'Published',
  updatedAt: 'updatedAt' in shoe ? shoe.updatedAt ?? null : null,
});

const isStorefrontSurface = (surface: CatalogRepositorySurface) => surface === 'storefront';

const resolveSurface = (surface?: CatalogRepositorySurface) => surface ?? DEFAULT_SURFACE;

const canUseCatalogFallback = (error: unknown) => {
  if (error instanceof TypeError) {
    return true;
  }

  if (error instanceof ApiError) {
    return error.status >= 500;
  }

  return false;
};

const resolveStorefrontCatalogFallback = async <T>(error: unknown, fallback: () => Promise<T>): Promise<T> => {
  if (canUseCatalogFallback(error)) {
    return fallback();
  }

  throw error;
};

const listStorefrontCatalog = async (query?: Parameters<CatalogRepository['listProducts']>[0]) => {
  const shoes = await apiClient.get<BackendCatalogShoe[]>('/api/shoes', {
    brand: query?.brand && query.brand !== 'All' ? query.brand : undefined,
    newArrivals: query?.isNew ? true : undefined,
  });

  return shoes.map(toSharedProductRecord).filter((product) => matchesCatalogQuery(product, query));
};

const listAdminCatalog = async (query?: Parameters<CatalogRepository['listProducts']>[0]) => {
  const products = await apiClient.get<BackendAdminCatalogRecordDto[]>('/api/admin/shoes');
  return products.map(toSharedProductRecord).filter((product) => matchesCatalogQuery(product, query));
};

const getStorefrontProduct = async (productId: string) => {
  const shoe = await apiClient.get<BackendCatalogShoe>(`/api/shoes/${encodeURIComponent(productId)}`);
  return toSharedProductRecord(shoe);
};

const getAdminProduct = async (productId: string) => {
  const product = await apiClient.get<BackendAdminCatalogRecordDto>(`/api/admin/shoes/${encodeURIComponent(productId)}`);
  return toSharedProductRecord(product);
};

const getExistingAdminProduct = async (productId: string) => {
  try {
    return await getAdminProduct(productId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
};

export const backendCatalogRepository: CatalogRepository = {
  async listProducts(query) {
    const surface = resolveSurface(query?.surface);

    try {
      return isStorefrontSurface(surface) ? await listStorefrontCatalog(query) : await listAdminCatalog(query);
    } catch (error) {
      if (!isStorefrontSurface(surface)) {
        throw error;
      }

      return resolveStorefrontCatalogFallback(error, () => localPreviewCatalogRepository.listProducts(query));
    }
  },

  async getProductById(productId, options) {
    const surface = resolveSurface(options?.surface);

    try {
      return isStorefrontSurface(surface)
        ? await getStorefrontProduct(productId)
        : await getAdminProduct(productId);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }

      if (!isStorefrontSurface(surface)) {
        throw error;
      }

      return resolveStorefrontCatalogFallback(error, () =>
        localPreviewCatalogRepository.getProductById(productId, { surface })
      );
    }
  },

  async saveProduct(product) {
    const existingProduct = await getExistingAdminProduct(product.id);

    if (!existingProduct) {
      return apiClient.post<BackendAdminCatalogRecordDto>('/api/admin/shoes', product);
    }

    return apiClient.post<BackendAdminCatalogRecordDto>(`/api/admin/shoes/${encodeURIComponent(product.id)}`, product);
  },

  async duplicateProduct(productId) {
    try {
      return apiClient.post<BackendAdminCatalogRecordDto>(
        `/api/admin/shoes/${encodeURIComponent(productId)}/duplicate`,
        {}
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }

      throw error;
    }
  },

  async setPublishState(productId, publishState) {
    try {
      return apiClient.post<BackendAdminCatalogRecordDto>(
        `/api/admin/shoes/${encodeURIComponent(productId)}/publish-state`,
        { publishState }
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }

      throw error;
    }
  },
};
