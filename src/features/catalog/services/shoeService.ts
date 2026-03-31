import { isPublishStateStorefrontVisible, toStorefrontProductView, type SharedProductRecord } from '../../admin/shared/types';
import {
  resolveCommerceRepositoryMode,
  storefrontCatalogRepository,
} from '../../commerce/repositories';
import { Shoe } from '../../../types';

/**
 * Service to handle storefront product reads.
 * Uses the active catalog repository for storefront reads.
 */
export const shoeService = {
  async getAllShoes(): Promise<Shoe[]> {
    if (resolveCommerceRepositoryMode() === 'local-preview') {
      await delay(200);
    }
    return (await storefrontCatalogRepository.listProducts({ surface: 'storefront' })).map(toStorefrontShoe);
  },

  async getShoeById(id: string): Promise<Shoe | undefined> {
    if (resolveCommerceRepositoryMode() === 'local-preview') {
      await delay(120);
    }
    const product = await storefrontCatalogRepository.getProductById(id, { surface: 'storefront' });
    if (!product || !isPublishStateStorefrontVisible(product.publishState)) {
      return undefined;
    }
    const shoe = toStorefrontShoe(product);
    return shoe;
  },

  async getShoesByBrand(brand: string): Promise<Shoe[]> {
    if (resolveCommerceRepositoryMode() === 'local-preview') {
      await delay(180);
    }
    return (
      await storefrontCatalogRepository.listProducts({
        brand,
        surface: 'storefront',
      })
    ).map(toStorefrontShoe);
  },

  async getNewArrivals(): Promise<Shoe[]> {
    if (resolveCommerceRepositoryMode() === 'local-preview') {
      await delay(160);
    }
    return (await storefrontCatalogRepository.listProducts({ isNew: true, surface: 'storefront' })).map(toStorefrontShoe);
  },

  async getFeaturedMerchandisingShoeById(id: string): Promise<Shoe | undefined> {
    await delay(90);
    const product = await storefrontCatalogRepository.getProductById(id, { surface: 'storefront' });
    if (!product || !isPublishStateStorefrontVisible(product.publishState)) {
      return undefined;
    }

    return toStorefrontShoe(product);
  },

  async getFeaturedMerchandisingFallbackShoe(): Promise<Shoe | null> {
    await delay(70);
    return (await storefrontCatalogRepository.listProducts({ surface: 'storefront' })).map(toStorefrontShoe).at(0) ?? null;
  },
};

const toStorefrontShoe = (product: SharedProductRecord): Shoe => {
  const storefrontView = toStorefrontProductView(product);
  return {
    ...storefrontView,
    compareAtPrice: storefrontView.compareAtPrice > 0 ? storefrontView.compareAtPrice : undefined,
  };
};

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
