import { isPublishStateStorefrontVisible, type SharedProductRecord } from '../../admin/shared/types';
import type { CatalogRepositoryQuery } from './contracts';

const normalizeQueryText = (value: string | undefined) => value?.trim().toLowerCase() ?? '';

export const matchesCatalogQuery = (product: SharedProductRecord, query?: CatalogRepositoryQuery) => {
  if (!query) {
    return true;
  }

  if (query.brand && query.brand !== 'All' && product.brand !== query.brand) {
    return false;
  }

  if (query.category && query.category !== 'All' && product.category !== query.category) {
    return false;
  }

  if (query.publishState && query.publishState !== 'All' && product.publishState !== query.publishState) {
    return false;
  }

  if (query.stockStatus && query.stockStatus !== 'All' && product.stockStatus !== query.stockStatus) {
    return false;
  }

  if (typeof query.isNew === 'boolean' && product.isNew !== query.isNew) {
    return false;
  }

  if ((query.surface === 'storefront' || query.storefrontVisibleOnly) && !isPublishStateStorefrontVisible(product.publishState)) {
    return false;
  }

  const searchTerm = normalizeQueryText(query.search);
  if (!searchTerm) {
    return true;
  }

  return (
    product.name.toLowerCase().includes(searchTerm) ||
    product.brand.toLowerCase().includes(searchTerm) ||
    product.category.toLowerCase().includes(searchTerm) ||
    product.colorway.toLowerCase().includes(searchTerm) ||
    product.id.toLowerCase().includes(searchTerm)
  );
};
