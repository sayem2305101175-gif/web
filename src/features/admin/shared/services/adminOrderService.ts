import { commerceRepositories } from '../../../commerce/repositories';
import type { AdminOrderDetail, AdminOrderStatus, AdminOrderSummary, SharedOrderRecord } from '../types';

const sleep = (durationMs: number) => new Promise((resolve) => window.setTimeout(resolve, durationMs));

const toSummary = (order: SharedOrderRecord): AdminOrderSummary => ({
  id: order.id,
  createdAt: order.createdAt,
  customerName: order.contact.name,
  customerEmail: order.contact.email,
  deliveryMethod: order.contact.deliveryMethod,
  itemCount: order.itemCount,
  total: order.total,
  status: order.status,
});

const toDetail = (order: SharedOrderRecord): AdminOrderDetail => ({
  ...toSummary(order),
  customerPhone: order.contact.phone,
  shippingCity: order.contact.city,
  shippingCountry: order.contact.country,
  shippingAddress: order.contact.shippingAddress,
  notes: order.contact.notes,
  subtotal: order.subtotal,
  shippingFee: order.shippingFee,
  lineItems: order.lineItems.map((lineItem) => ({ ...lineItem })),
});

const sortedByCreatedAt = (orders: AdminOrderSummary[]) =>
  [...orders].sort((firstOrder, secondOrder) => new Date(secondOrder.createdAt).getTime() - new Date(firstOrder.createdAt).getTime());

export const adminOrderService = {
  async listOrders(): Promise<AdminOrderSummary[]> {
    await sleep(180);
    return sortedByCreatedAt((await commerceRepositories.orders.listOrders()).map(toSummary));
  },

  async getOrderDetail(orderId: string): Promise<AdminOrderDetail | null> {
    await sleep(140);
    const order = await commerceRepositories.orders.getOrderById(orderId);
    return order ? toDetail(order) : null;
  },

  async updateOrderStatus(orderId: string, status: AdminOrderStatus): Promise<AdminOrderDetail | null> {
    await sleep(160);
    const updatedOrder = await commerceRepositories.orders.updateOrderStatus(orderId, status);
    return updatedOrder ? toDetail(updatedOrder) : null;
  },

  subscribe(listener: () => void): () => void {
    return commerceRepositories.orders.subscribe?.(listener) ?? (() => undefined);
  },
};
