import { sharedCommerceStore } from '../../../admin/shared/store';
import {
  type CommercePublishState,
} from '../../../admin/shared/types';
import { matchesCatalogQuery } from '../catalogQuery';
import type { CatalogRepository } from '../contracts';
import { createRepositorySubscriptionChannel } from '../subscriptions';

const catalogSubscriptionChannel = createRepositorySubscriptionChannel();

export const createLocalPreviewProductId = () => {
  const existingIds = new Set(sharedCommerceStore.getProducts().map((product) => product.id));
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const nextId = `prod-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    if (!existingIds.has(nextId)) {
      return nextId;
    }
  }

  return `prod-fallback-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

const setPublishState = (productId: string, publishState: CommercePublishState) => {
  const existingProduct = sharedCommerceStore.getProductById(productId);
  if (!existingProduct) {
    return null;
  }

  const updatedProduct = sharedCommerceStore.upsertProduct({
    ...existingProduct,
    publishState,
    updatedAt: new Date().toISOString(),
  });
  catalogSubscriptionChannel.emit();
  return updatedProduct;
};

export const localPreviewCatalogRepository: CatalogRepository = {
  async listProducts(query) {
    return sharedCommerceStore.getProducts().filter((product) => matchesCatalogQuery(product, query));
  },

  async getProductById(productId, options) {
    const product = sharedCommerceStore.getProductById(productId);
    if (!product) {
      return null;
    }

    if (options?.surface === 'storefront' && product.publishState !== 'Published') {
      return null;
    }

    return product;
  },

  async saveProduct(product) {
    const savedProduct = sharedCommerceStore.upsertProduct(product);
    catalogSubscriptionChannel.emit();
    return savedProduct;
  },

  async duplicateProduct(productId) {
    const existingProduct = sharedCommerceStore.getProductById(productId);
    if (!existingProduct) {
      return null;
    }

    const duplicatedProduct = sharedCommerceStore.upsertProduct({
      ...existingProduct,
      id: createLocalPreviewProductId(),
      name: `${existingProduct.name} Copy`,
      publishState: 'Draft',
      updatedAt: new Date().toISOString(),
    });
    catalogSubscriptionChannel.emit();
    return duplicatedProduct;
  },

  async setPublishState(productId, publishState) {
    return setPublishState(productId, publishState);
  },

  subscribe(listener) {
    return catalogSubscriptionChannel.subscribe(listener);
  },
};
