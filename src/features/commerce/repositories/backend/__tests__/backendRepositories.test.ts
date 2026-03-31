import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getDefaultStorefrontContentSnapshot } from '../../../../../content/storefront';
import { ApiError } from '../../../../../services/apiClient';
import type { OrderSnapshot } from '../../../../../types';
import type { SharedProductRecord } from '../../../../admin/shared/types';

const mockedTransport = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock('../../../../../services/apiClient', () => ({
  isBackendConfigured: true,
  apiClient: mockedTransport,
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

import {
  backendCatalogRepository,
  backendOrderRepository,
  backendStorefrontContentRepository,
} from '../index';

const ORDER_RECORD = {
  id: 'WS-2001',
  createdAt: '2026-03-25T10:00:00.000Z',
  status: 'Pending' as const,
  itemCount: 1,
  subtotal: 220,
  shippingFee: 14,
  total: 234,
  updatedAt: null,
  contact: {
    name: 'Taylor Reed',
    email: 'taylor@example.com',
    phone: '+1 555 0100',
    city: 'Boston',
    country: 'USA',
    shippingAddress: '12 Beacon St',
    deliveryMethod: 'Standard' as const,
    notes: '',
  },
  lineItems: [
    {
      id: 'li-1',
      productId: 'shoe-1',
      productName: 'Backend Order Shoe',
      size: 'US 9',
      quantity: 1,
      unitPrice: 220,
      lineTotal: 220,
    },
  ],
};

const ORDER_SNAPSHOT: OrderSnapshot = {
  id: 'ORD-1',
  createdAt: '2026-03-25T10:05:00.000Z',
  items: [],
  subtotal: 220,
  shipping: 14,
  total: 234,
  contact: {
    name: 'Taylor Reed',
    email: 'taylor@example.com',
    city: 'Boston',
    country: 'USA',
    delivery: 'Standard',
    notes: '',
  },
};

const ADMIN_PRODUCT: SharedProductRecord = {
  id: 'shoe-1',
  name: 'Backend Admin Shoe',
  brand: 'Signal Lab',
  category: 'Performance',
  colorway: 'Black / Volt',
  price: 220,
  compareAtPrice: 260,
  stockStatus: 'In stock',
  quantityOnHand: 18,
  sizes: ['US 9'],
  materials: ['Mesh'],
  shortBlurb: 'Backend admin catalog record.',
  description: 'Backend admin catalog record used to verify Step 8 backend mode alignment.',
  image: 'https://example.com/shoe-1.jpg',
  modelUrl: 'https://example.com/shoe-1.glb',
  shippingNote: 'Ships in 24 hours',
  featuredNote: 'Featured note',
  accentColor: '#111827',
  hypeScore: 88,
  isNew: true,
  publishState: 'Published',
  updatedAt: '2026-03-25T12:00:00.000Z',
};

const STOREFRONT_SHOE = {
  id: 'shoe-1',
  name: 'Backend Storefront Shoe',
  brand: 'Signal Lab',
  category: 'Performance',
  colorway: 'Black / Volt',
  price: 220,
  compareAtPrice: 260,
  stockStatus: 'In stock' as const,
  sizes: ['US 9'],
  materials: ['Mesh'],
  shortBlurb: 'Backend storefront record.',
  description: 'Backend storefront catalog record used to verify public catalog reads.',
  image: 'https://example.com/shoe-1.jpg',
  modelUrl: 'https://example.com/shoe-1.glb',
  shippingNote: 'Ships in 24 hours',
  featuredNote: 'Featured note',
  accentColor: '#111827',
  hypeScore: 88,
  isNew: true,
  publishState: 'Published' as const,
};

describe('backend commerce repositories', () => {
  beforeEach(() => {
    mockedTransport.get.mockReset();
    mockedTransport.post.mockReset();
  });

  it('reads and saves storefront content through backend endpoints', async () => {
    const snapshot = getDefaultStorefrontContentSnapshot();
    mockedTransport.get.mockResolvedValueOnce(snapshot);
    mockedTransport.post.mockResolvedValueOnce({
      ...snapshot,
      hero: {
        ...snapshot.hero,
        headline: 'Backend headline',
      },
    });

    const initialContent = await backendStorefrontContentRepository.getContent();
    const savedContent = await backendStorefrontContentRepository.saveContent({
      ...snapshot,
      hero: {
        ...snapshot.hero,
        headline: 'Backend headline',
      },
    });

    expect(initialContent.hero.headline).toBe(snapshot.hero.headline);
    expect(savedContent.hero.headline).toBe('Backend headline');
    expect(mockedTransport.get).toHaveBeenCalledWith('/api/storefront-content');
    expect(mockedTransport.post).toHaveBeenCalledWith('/api/admin/storefront-content', expect.any(Object));
  });

  it('routes catalog reads and writes through the correct backend endpoints by surface', async () => {
    mockedTransport.get
      .mockResolvedValueOnce([ADMIN_PRODUCT])
      .mockResolvedValueOnce(ADMIN_PRODUCT)
      .mockResolvedValueOnce(STOREFRONT_SHOE)
      .mockResolvedValueOnce(ADMIN_PRODUCT);
    mockedTransport.post
      .mockResolvedValueOnce(ADMIN_PRODUCT)
      .mockResolvedValueOnce({
        ...ADMIN_PRODUCT,
        id: 'shoe-2',
        name: 'Backend Admin Shoe Copy',
        publishState: 'Draft',
      })
      .mockResolvedValueOnce({
        ...ADMIN_PRODUCT,
        publishState: 'Draft',
      });

    const adminList = await backendCatalogRepository.listProducts({ surface: 'admin' });
    const adminDetail = await backendCatalogRepository.getProductById(ADMIN_PRODUCT.id, { surface: 'admin' });
    const storefrontDetail = await backendCatalogRepository.getProductById(STOREFRONT_SHOE.id, { surface: 'storefront' });
    const saved = await backendCatalogRepository.saveProduct(ADMIN_PRODUCT);
    const duplicated = await backendCatalogRepository.duplicateProduct?.(ADMIN_PRODUCT.id);
    const unpublished = await backendCatalogRepository.setPublishState?.(ADMIN_PRODUCT.id, 'Draft');

    expect(adminList[0]?.id).toBe(ADMIN_PRODUCT.id);
    expect(adminDetail?.quantityOnHand).toBe(ADMIN_PRODUCT.quantityOnHand);
    expect(storefrontDetail?.id).toBe(STOREFRONT_SHOE.id);
    expect(saved?.id).toBe(ADMIN_PRODUCT.id);
    expect(duplicated?.publishState).toBe('Draft');
    expect(unpublished?.publishState).toBe('Draft');
    expect(mockedTransport.get).toHaveBeenNthCalledWith(1, '/api/admin/shoes');
    expect(mockedTransport.get).toHaveBeenNthCalledWith(
      2,
      `/api/admin/shoes/${encodeURIComponent(ADMIN_PRODUCT.id)}`
    );
    expect(mockedTransport.get).toHaveBeenNthCalledWith(
      3,
      `/api/shoes/${encodeURIComponent(STOREFRONT_SHOE.id)}`
    );
    expect(mockedTransport.get).toHaveBeenNthCalledWith(
      4,
      `/api/admin/shoes/${encodeURIComponent(ADMIN_PRODUCT.id)}`
    );
    expect(mockedTransport.post).toHaveBeenNthCalledWith(1, `/api/admin/shoes/${encodeURIComponent(ADMIN_PRODUCT.id)}`, ADMIN_PRODUCT);
    expect(mockedTransport.post).toHaveBeenNthCalledWith(
      2,
      `/api/admin/shoes/${encodeURIComponent(ADMIN_PRODUCT.id)}/duplicate`,
      {}
    );
    expect(mockedTransport.post).toHaveBeenNthCalledWith(
      3,
      `/api/admin/shoes/${encodeURIComponent(ADMIN_PRODUCT.id)}/publish-state`,
      { publishState: 'Draft' }
    );
  });

  it('lists, loads, and updates backend admin orders through backend endpoints', async () => {
    mockedTransport.get.mockResolvedValueOnce([ORDER_RECORD]).mockResolvedValueOnce(ORDER_RECORD);
    mockedTransport.post.mockResolvedValueOnce({
      ...ORDER_RECORD,
      status: 'Shipped',
      updatedAt: '2026-03-25T11:00:00.000Z',
    });

    const list = await backendOrderRepository.listOrders();
    const detail = await backendOrderRepository.getOrderById(ORDER_RECORD.id);
    const updated = await backendOrderRepository.updateOrderStatus(ORDER_RECORD.id, 'Shipped');

    expect(list[0]?.id).toBe(ORDER_RECORD.id);
    expect(detail?.id).toBe(ORDER_RECORD.id);
    expect(updated?.status).toBe('Shipped');
    expect(mockedTransport.get).toHaveBeenNthCalledWith(1, '/api/admin/orders');
    expect(mockedTransport.get).toHaveBeenNthCalledWith(2, `/api/admin/orders/${encodeURIComponent(ORDER_RECORD.id)}`);
    expect(mockedTransport.post).toHaveBeenCalledWith(
      `/api/admin/orders/${encodeURIComponent(ORDER_RECORD.id)}/status`,
      { status: 'Shipped' }
    );
  });

  it('returns null for missing backend orders instead of throwing', async () => {
    mockedTransport.get.mockRejectedValueOnce(new ApiError('Order not found', 404, null));
    mockedTransport.post.mockRejectedValueOnce(new ApiError('Order not found', 404, null));

    await expect(backendOrderRepository.getOrderById('missing-order')).resolves.toBeNull();
    await expect(backendOrderRepository.updateOrderStatus('missing-order', 'Shipped')).resolves.toBeNull();
  });

  it('keeps non-404 backend order failures as rejections', async () => {
    mockedTransport.get.mockRejectedValueOnce(new ApiError('Backend unavailable', 500, null));
    mockedTransport.post.mockRejectedValueOnce(new ApiError('Backend unavailable', 500, null));

    await expect(backendOrderRepository.getOrderById(ORDER_RECORD.id)).rejects.toMatchObject({ status: 500 });
    await expect(backendOrderRepository.updateOrderStatus(ORDER_RECORD.id, 'Shipped')).rejects.toMatchObject({
      status: 500,
    });
  });

  it('submits checkout snapshots through the backend order repository', async () => {
    mockedTransport.post.mockResolvedValueOnce(ORDER_SNAPSHOT);

    const submitted = await backendOrderRepository.submitOrder?.(ORDER_SNAPSHOT);

    expect(submitted).toEqual(ORDER_SNAPSHOT);
    expect(mockedTransport.post).toHaveBeenCalledWith('/api/orders', ORDER_SNAPSHOT);
  });
});
