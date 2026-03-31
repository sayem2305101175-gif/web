import { sharedCommerceStore } from '../../../admin/shared/store';
import type { OrderRepository } from '../contracts';
import { createRepositorySubscriptionChannel } from '../subscriptions';

const orderSubscriptionChannel = createRepositorySubscriptionChannel();

export const localPreviewOrderRepository: OrderRepository = {
  async listOrders() {
    return sharedCommerceStore.getOrders();
  },

  async submitOrder(snapshot) {
    const submittedOrder = sharedCommerceStore.createOrderFromSnapshot(snapshot);
    orderSubscriptionChannel.emit();
    return submittedOrder;
  },

  async getOrderById(orderId) {
    return sharedCommerceStore.getOrderById(orderId);
  },

  async updateOrderStatus(orderId, status) {
    const updatedOrder = sharedCommerceStore.updateOrderStatus(orderId, status);
    if (updatedOrder) {
      orderSubscriptionChannel.emit();
    }
    return updatedOrder;
  },

  subscribe(listener) {
    return orderSubscriptionChannel.subscribe(listener);
  },
};
