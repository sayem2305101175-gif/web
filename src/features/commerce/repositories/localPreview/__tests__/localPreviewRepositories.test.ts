import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getDefaultStorefrontContentSnapshot } from '../../../../../content/storefront';
import type { OrderSnapshot } from '../../../../../types';
import { sharedCommerceStore } from '../../../../admin/shared/store';
import {
  localPreviewCatalogRepository,
  localPreviewOrderRepository,
  localPreviewStorefrontContentRepository,
} from '../index';

const SHARED_STORE_KEY = 'velosnak_admin_storefront_shared_v1';
const STOREFRONT_CONTENT_KEY = 'velosnak_storefront_content_v1';

const buildOrderSnapshot = (overrides: Partial<OrderSnapshot> = {}): OrderSnapshot => ({
  id: 'WS-2000',
  createdAt: '2026-03-25T08:45:00.000Z',
  items: [
    {
      ...sharedCommerceStore.getProducts()[0]!,
      lineId: 'ws-2000-li-1',
      quantity: 1,
      selectedSize: 'US 9',
    },
  ],
  subtotal: 295,
  shipping: 18,
  total: 313,
  contact: {
    name: 'Step Four Tester',
    email: 'step4@example.com',
    city: 'Dhaka',
    country: 'Bangladesh',
    delivery: 'Standard',
    notes: 'Leave at reception.',
  },
  ...overrides,
});

describe('local preview commerce repositories', () => {
  beforeEach(() => {
    window.localStorage.removeItem(SHARED_STORE_KEY);
    window.localStorage.removeItem(STOREFRONT_CONTENT_KEY);
  });

  afterEach(() => {
    window.localStorage.removeItem(SHARED_STORE_KEY);
    window.localStorage.removeItem(STOREFRONT_CONTENT_KEY);
  });

  it('filters catalog products using shared query behavior', async () => {
    const publishedProducts = await localPreviewCatalogRepository.listProducts({ storefrontVisibleOnly: true });
    expect(publishedProducts.every((product) => product.publishState === 'Published')).toBe(true);

    const draftProducts = await localPreviewCatalogRepository.listProducts({ publishState: 'Draft' });
    expect(draftProducts.every((product) => product.publishState === 'Draft')).toBe(true);
  });

  it('persists content through the shared preview store', async () => {
    const snapshot = getDefaultStorefrontContentSnapshot();
    const saved = await localPreviewStorefrontContentRepository.saveContent({
      ...snapshot,
      hero: {
        ...snapshot.hero,
        headline: 'Repository headline',
      },
    });

    expect(saved.hero.headline).toBe('Repository headline');
    expect((await localPreviewStorefrontContentRepository.getContent()).hero.headline).toBe('Repository headline');
  });

  it('updates order status through the shared preview store', async () => {
    const firstOrder = sharedCommerceStore.getOrders()[0];
    expect(firstOrder).toBeDefined();

    const updated = await localPreviewOrderRepository.updateOrderStatus(firstOrder!.id, 'Delivered');
    expect(updated?.status).toBe('Delivered');
    expect((await localPreviewOrderRepository.getOrderById(firstOrder!.id))?.status).toBe('Delivered');
  });

  it('submits shopper orders through the shared preview store and keeps admin reads in sync', async () => {
    const snapshot = buildOrderSnapshot();

    const submitted = await localPreviewOrderRepository.submitOrder?.(snapshot);
    expect(submitted).toBeDefined();
    expect(submitted?.id).toBe(snapshot.id);

    const newestOrder = sharedCommerceStore.getOrders()[0];
    expect(newestOrder?.id).toBe(snapshot.id);
    expect(newestOrder?.status).toBe('Pending');
    expect(newestOrder?.contact.email).toBe(snapshot.contact.email);
    expect(newestOrder?.lineItems[0]?.productId).toBe(snapshot.items[0]?.id);

    const loaded = await localPreviewOrderRepository.getOrderById(snapshot.id);
    expect(loaded?.total).toBe(snapshot.total);
    expect(loaded?.shippingFee).toBe(snapshot.shipping);
  });

  it('normalizes duplicate shopper order ids before persisting them', async () => {
    const snapshot = buildOrderSnapshot({ id: 'WS-1048' });

    const submitted = await localPreviewOrderRepository.submitOrder?.(snapshot);
    expect(submitted?.id).toBe('WS-1048-2');
    expect(sharedCommerceStore.getOrders()[0]?.id).toBe('WS-1048-2');
    expect(await localPreviewOrderRepository.getOrderById('WS-1048-2')).not.toBeNull();
  });

  it('emits catalog change notifications for local preview mutations', async () => {
    const listener = vi.fn();
    const unsubscribe = localPreviewCatalogRepository.subscribe?.(listener);

    const existingProduct = sharedCommerceStore.getProducts()[0];
    expect(existingProduct).toBeDefined();

    await localPreviewCatalogRepository.saveProduct({
      ...existingProduct!,
      shortBlurb: `${existingProduct!.shortBlurb} updated`,
    });

    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe?.();
  });

  it('emits content change notifications for local preview mutations', async () => {
    const listener = vi.fn();
    const unsubscribe = localPreviewStorefrontContentRepository.subscribe?.(listener);

    const snapshot = getDefaultStorefrontContentSnapshot();
    await localPreviewStorefrontContentRepository.saveContent({
      ...snapshot,
      shipping: {
        ...snapshot.shipping,
        message: 'Updated shipping message',
      },
    });

    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe?.();
  });

  it('emits order change notifications for local preview status updates', async () => {
    const listener = vi.fn();
    const unsubscribe = localPreviewOrderRepository.subscribe?.(listener);

    const firstOrder = sharedCommerceStore.getOrders()[0];
    expect(firstOrder).toBeDefined();

    await localPreviewOrderRepository.updateOrderStatus(firstOrder!.id, 'Shipped');

    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe?.();
  });

  it('emits order change notifications for local preview submissions', async () => {
    const listener = vi.fn();
    const unsubscribe = localPreviewOrderRepository.subscribe?.(listener);

    await localPreviewOrderRepository.submitOrder?.(buildOrderSnapshot({ id: 'WS-3000' }));

    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe?.();
  });
});
