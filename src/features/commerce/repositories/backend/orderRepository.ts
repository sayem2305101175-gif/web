import { ApiError, apiClient } from '../../../../services/apiClient';
import type { OrderRepository } from '../contracts';
import type {
  BackendOrderRecordDto,
  BackendOrderStatusUpdateDto,
  BackendOrderSubmissionDto,
} from './contracts';

const isMissingOrderError = (error: unknown) => error instanceof ApiError && error.status === 404;

export const backendOrderRepository: OrderRepository = {
  async listOrders() {
    return apiClient.get<BackendOrderRecordDto[]>('/api/admin/orders');
  },

  async getOrderById(orderId) {
    try {
      return await apiClient.get<BackendOrderRecordDto>(`/api/admin/orders/${encodeURIComponent(orderId)}`);
    } catch (error) {
      if (isMissingOrderError(error)) {
        return null;
      }

      throw error;
    }
  },

  async updateOrderStatus(orderId, status) {
    try {
      return await apiClient.post<BackendOrderRecordDto>(
        `/api/admin/orders/${encodeURIComponent(orderId)}/status`,
        { status } satisfies BackendOrderStatusUpdateDto
      );
    } catch (error) {
      if (isMissingOrderError(error)) {
        return null;
      }

      throw error;
    }
  },

  async submitOrder(snapshot) {
    return apiClient.post<BackendOrderSubmissionDto>('/api/orders', snapshot);
  },
};
