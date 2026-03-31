import type { CommerceRepositories } from './contracts';
import {
  backendCatalogRepository,
  backendOrderRepository,
  backendStorefrontContentRepository,
} from './backend';
import {
  localPreviewCatalogRepository,
  createLocalPreviewProductId,
  localPreviewOrderRepository,
  localPreviewStorefrontContentRepository,
} from './localPreview';
import { selectCommerceRepositoryAdapter } from './runtime';

export const commerceRepositories: CommerceRepositories = {
  catalog: selectCommerceRepositoryAdapter({
    backend: backendCatalogRepository,
    localPreview: localPreviewCatalogRepository,
  }),
  content: selectCommerceRepositoryAdapter({
    backend: backendStorefrontContentRepository,
    localPreview: localPreviewStorefrontContentRepository,
  }),
  orders: selectCommerceRepositoryAdapter({
    backend: backendOrderRepository,
    localPreview: localPreviewOrderRepository,
  }),
};

export const createCommerceDraftProductId = () => createLocalPreviewProductId();

export const storefrontCatalogRepository = selectCommerceRepositoryAdapter({
  backend: backendCatalogRepository,
  localPreview: localPreviewCatalogRepository,
});

export const storefrontContentRepository = commerceRepositories.content;
