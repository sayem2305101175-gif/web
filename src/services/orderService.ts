import { OrderSnapshot } from '../types';
import { apiClient, isBackendConfigured } from './apiClient';

export const orderService = {
  async createOrder(snapshot: OrderSnapshot): Promise<OrderSnapshot> {
    if (!isBackendConfigured) {
      throw new Error('Ordering is unavailable until the backend API is configured.');
    }

    return apiClient.post<OrderSnapshot>('/api/orders', snapshot);
  },
};
