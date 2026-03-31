import type { StorefrontContentSnapshot } from '../../../../content/storefront';
import { commerceRepositories } from '../../../commerce/repositories';
import type { AdminContentSection, AdminFeaturedProductOption } from '../types/admin';
import { adminCatalogService } from './adminCatalogService';

const CONTENT_SECTIONS: Array<Omit<AdminContentSection, 'lastUpdatedAt'>> = [
  {
    id: 'hero',
    name: 'Hero Messaging',
    description: 'Top-strip announcement, hero copy, and primary storefront call-to-action labels.',
  },
  {
    id: 'featured-drop',
    name: 'Featured Drop',
    description: 'Home hero product spotlight, tied directly to a real catalog product.',
  },
  {
    id: 'trust',
    name: 'Trust Content',
    description: 'Why-shop-here framing and the three promise cards shown on the home page.',
  },
  {
    id: 'faq',
    name: 'FAQ',
    description: 'Common storefront questions and answers shown in the FAQ section.',
  },
  {
    id: 'cta',
    name: 'Primary CTA',
    description: 'Bottom call-to-action panel including headline, button label, and quick chips.',
  },
  {
    id: 'shipping',
    name: 'Shipping Messaging',
    description: 'Storefront shipping title and supporting copy shown in the footer region.',
  },
  {
    id: 'returns',
    name: 'Returns Messaging',
    description: 'Storefront returns title and supporting copy shown in the footer region.',
  },
];

const withLatency = <T>(result: T, durationMs = 140) =>
  new Promise<T>((resolve) => {
    window.setTimeout(() => resolve(result), durationMs);
  });

export const adminContentService = {
  async listSections(): Promise<AdminContentSection[]> {
    const snapshot = await commerceRepositories.content.getContent();
    const sections = CONTENT_SECTIONS.map((section) => ({
      ...section,
      lastUpdatedAt: snapshot.updatedAt,
    }));

    return withLatency(sections, 110);
  },

  async getStorefrontContent(): Promise<StorefrontContentSnapshot> {
    return withLatency(await commerceRepositories.content.getContent(), 120);
  },

  async saveStorefrontContent(
    snapshot: StorefrontContentSnapshot
  ): Promise<{ savedAt: string; snapshot: StorefrontContentSnapshot }> {
    const nextSnapshot = await commerceRepositories.content.saveContent(snapshot);
    return withLatency(
      {
        savedAt: nextSnapshot.updatedAt ?? new Date().toISOString(),
        snapshot: nextSnapshot,
      },
      180
    );
  },

  async listFeaturedProducts(): Promise<AdminFeaturedProductOption[]> {
    const products = await adminCatalogService.listProducts();
    return products
      .map((product) => ({
        id: product.id,
        name: product.name,
        brand: product.brand,
        publishState: product.publishState,
        stockStatus: product.stockStatus,
      }))
      .sort((firstProduct, secondProduct) => {
        const publishStateRank = (publishState: AdminFeaturedProductOption['publishState']) => {
          if (publishState === 'Published') {
            return 0;
          }
          if (publishState === 'Draft') {
            return 1;
          }
          return 2;
        };

        const publishRankDifference =
          publishStateRank(firstProduct.publishState) - publishStateRank(secondProduct.publishState);
        if (publishRankDifference !== 0) {
          return publishRankDifference;
        }

        return firstProduct.name.localeCompare(secondProduct.name);
      });
  },

  subscribe(listener: () => void): () => void {
    const unsubscribeContent = commerceRepositories.content.subscribe?.(listener);
    const unsubscribeCatalog = commerceRepositories.catalog.subscribe?.(listener);

    return () => {
      unsubscribeContent?.();
      unsubscribeCatalog?.();
    };
  },
};
