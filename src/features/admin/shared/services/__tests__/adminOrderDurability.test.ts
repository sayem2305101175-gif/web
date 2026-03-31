import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const SHARED_STORE_KEY = 'velosnak_admin_storefront_shared_v1';
const STOREFRONT_CONTENT_KEY = 'velosnak_storefront_content_v1';

const loadOrderService = async () => {
  vi.resetModules();
  vi.doMock('../../../../../services/apiClient', () => ({
    isBackendConfigured: false,
    apiClient: {
      get: vi.fn(),
      post: vi.fn(),
    },
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
  const { adminOrderService } = await import('../adminOrderService');
  return adminOrderService;
};

describe('admin order durability', () => {
  beforeEach(() => {
    window.localStorage.removeItem(SHARED_STORE_KEY);
    window.localStorage.removeItem(STOREFRONT_CONTENT_KEY);
    vi.resetModules();
    vi.doUnmock('../../../../../services/apiClient');
  });

  afterEach(() => {
    window.localStorage.removeItem(SHARED_STORE_KEY);
    window.localStorage.removeItem(STOREFRONT_CONTENT_KEY);
    vi.resetModules();
    vi.doUnmock('../../../../../services/apiClient');
  });

  it('persists status updates across module reload and keeps list/detail in sync', async () => {
    const adminOrderService = await loadOrderService();
    const targetOrderId = 'WS-1047';

    const initialList = await adminOrderService.listOrders();
    const initialRow = initialList.find((order) => order.id === targetOrderId);
    expect(initialRow?.status).toBe('Pending');

    const initialDetail = await adminOrderService.getOrderDetail(targetOrderId);
    expect(initialDetail?.status).toBe('Pending');

    const updatedDetail = await adminOrderService.updateOrderStatus(targetOrderId, 'Shipped');
    expect(updatedDetail?.status).toBe('Shipped');

    const listAfterUpdate = await adminOrderService.listOrders();
    const rowAfterUpdate = listAfterUpdate.find((order) => order.id === targetOrderId);
    expect(rowAfterUpdate?.status).toBe('Shipped');

    const detailAfterUpdate = await adminOrderService.getOrderDetail(targetOrderId);
    expect(detailAfterUpdate?.status).toBe('Shipped');

    const reloadedOrderService = await loadOrderService();
    const listAfterReload = await reloadedOrderService.listOrders();
    const rowAfterReload = listAfterReload.find((order) => order.id === targetOrderId);
    expect(rowAfterReload?.status).toBe('Shipped');

    const detailAfterReload = await reloadedOrderService.getOrderDetail(targetOrderId);
    expect(detailAfterReload?.status).toBe('Shipped');
  });

  it('keeps multi-step status transitions durable across repeated reload boundaries', async () => {
    const targetOrderId = 'WS-1048';
    const firstOrderService = await loadOrderService();

    const initialDetail = await firstOrderService.getOrderDetail(targetOrderId);
    expect(initialDetail?.status).toBe('Processing');

    const processingToShipped = await firstOrderService.updateOrderStatus(targetOrderId, 'Shipped');
    expect(processingToShipped?.status).toBe('Shipped');

    const secondOrderService = await loadOrderService();
    const shippedDetailAfterReload = await secondOrderService.getOrderDetail(targetOrderId);
    expect(shippedDetailAfterReload?.status).toBe('Shipped');

    const shippedToDelivered = await secondOrderService.updateOrderStatus(targetOrderId, 'Delivered');
    expect(shippedToDelivered?.status).toBe('Delivered');

    const thirdOrderService = await loadOrderService();
    const deliveredListAfterReload = await thirdOrderService.listOrders();
    const deliveredRow = deliveredListAfterReload.find((order) => order.id === targetOrderId);
    expect(deliveredRow?.status).toBe('Delivered');
  });
});
