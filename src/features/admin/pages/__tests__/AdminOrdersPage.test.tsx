import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AdminOrdersPage from '../AdminOrdersPage';
import type { AdminOrderDetail, AdminOrderSummary } from '../../shared/types';
import { confirmAdminNavigation } from '../../shared/utils';

const mockedOrderService = vi.hoisted(() => ({
  listOrders: vi.fn(),
  getOrderDetail: vi.fn(),
  updateOrderStatus: vi.fn(),
  subscribe: vi.fn(),
}));

vi.mock('../../shared/services', () => ({
  adminOrderService: mockedOrderService,
}));

const ORDER_ID = 'ORD-1001';

const orderSummary: AdminOrderSummary = {
  id: ORDER_ID,
  createdAt: '2026-03-25T08:00:00.000Z',
  customerName: 'Ariana Holt',
  customerEmail: 'ariana@example.com',
  deliveryMethod: 'Express',
  itemCount: 2,
  total: 540,
  status: 'Pending',
};

const orderDetail: AdminOrderDetail = {
  ...orderSummary,
  customerPhone: '+1 555 201 4491',
  shippingCity: 'Austin',
  shippingCountry: 'USA',
  shippingAddress: '1205 W 6th St',
  notes: 'Leave at front desk.',
  subtotal: 510,
  shippingFee: 30,
  lineItems: [
    {
      id: 'line-1',
      productId: '1',
      productName: 'Phantom Velocity X',
      size: 'US 9',
      quantity: 1,
      unitPrice: 295,
      lineTotal: 295,
    },
    {
      id: 'line-2',
      productId: '6',
      productName: 'Titanium Trek High',
      size: 'US 10',
      quantity: 1,
      unitPrice: 245,
      lineTotal: 245,
    },
  ],
};

const orderServiceListeners = new Set<() => void>();
const emitOrderServiceUpdate = () => {
  orderServiceListeners.forEach((listener) => listener());
};

const renderOrdersPage = () =>
  render(
    <MemoryRouter initialEntries={['/admin/orders']}>
      <Routes>
        <Route path="/admin/orders" element={<AdminOrdersPage />} />
        <Route path="/admin/orders/:orderId" element={<AdminOrdersPage />} />
      </Routes>
    </MemoryRouter>
  );

describe('AdminOrdersPage', () => {
  beforeEach(() => {
    mockedOrderService.listOrders.mockResolvedValue([orderSummary]);
    mockedOrderService.getOrderDetail.mockResolvedValue(orderDetail);
    mockedOrderService.updateOrderStatus.mockImplementation(async (_orderId: string, status: AdminOrderDetail['status']) => ({
      ...orderDetail,
      status,
    }));
    mockedOrderService.subscribe.mockImplementation((listener: () => void) => {
      orderServiceListeners.add(listener);
      return () => {
        orderServiceListeners.delete(listener);
      };
    });
  });

  afterEach(() => {
    orderServiceListeners.clear();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('supports keyboard order selection and confirmed status update workflow', async () => {
    renderOrdersPage();

    const orderRow = await screen.findByRole('button', { name: /ord-1001/i });
    fireEvent.keyDown(orderRow, { key: 'Enter' });

    await screen.findByText(/order detail/i);
    fireEvent.change(screen.getByLabelText(/update status/i), { target: { value: 'Shipped' } });
    fireEvent.click(screen.getByRole('button', { name: /review change/i }));

    await screen.findByRole('dialog');
    fireEvent.click(screen.getByRole('button', { name: /apply status/i }));

    await waitFor(() => {
      expect(mockedOrderService.updateOrderStatus).toHaveBeenCalledWith(ORDER_ID, 'Shipped');
    });

    expect(await screen.findByText(/order status updated to shipped/i)).toBeInTheDocument();
  });

  it('refreshes the queue when subscribed order data changes', async () => {
    let currentOrders = [orderSummary];
    const shopperOrder: AdminOrderSummary = {
      ...orderSummary,
      id: 'ORD-2002',
      createdAt: '2026-03-25T10:30:00.000Z',
      customerName: 'Checkout Shopper',
      customerEmail: 'shopper@example.com',
      status: 'Pending',
    };

    mockedOrderService.listOrders.mockImplementation(async () => currentOrders);

    renderOrdersPage();
    await screen.findByRole('button', { name: /ord-1001/i });

    await act(async () => {
      currentOrders = [shopperOrder, orderSummary];
      emitOrderServiceUpdate();
    });

    expect(await screen.findByRole('button', { name: /ord-2002/i })).toBeInTheDocument();
    expect(screen.getByText(/checkout shopper/i)).toBeInTheDocument();
  });

  it('preserves pending-change navigation safety before status is applied', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
    renderOrdersPage();

    const orderRow = await screen.findByRole('button', { name: /ord-1001/i });
    fireEvent.keyDown(orderRow, { key: 'Enter' });

    await screen.findByText(/order detail/i);
    expect(confirmAdminNavigation()).toBe(true);

    fireEvent.change(screen.getByLabelText(/update status/i), { target: { value: 'Shipped' } });

    await waitFor(() => {
      expect(confirmAdminNavigation()).toBe(false);
    });
    expect(confirmSpy).toHaveBeenLastCalledWith('You have an un-applied order status change. Leave anyway?');
    expect(confirmAdminNavigation()).toBe(true);
  });
});
