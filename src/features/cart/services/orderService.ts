import { OrderSnapshot } from '../../../types';
import { commerceRepositories } from '../../commerce/repositories';

export const orderService = {
  canCreateOrder(): boolean {
    return typeof commerceRepositories.orders.submitOrder === 'function';
  },

  async createOrder(snapshot: OrderSnapshot): Promise<OrderSnapshot> {
    const submitOrder = commerceRepositories.orders.submitOrder;
    if (!submitOrder) {
      throw new Error('Order submission is unavailable in this build.');
    }

    return submitOrder(snapshot);
  },
};
