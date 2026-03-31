import { apiClient } from '../../../../services/apiClient';
import type { StorefrontContentRepository } from '../contracts';
import type { BackendStorefrontContentDto } from './contracts';

export const backendStorefrontContentRepository: StorefrontContentRepository = {
  async getContent() {
    return apiClient.get<BackendStorefrontContentDto>('/api/storefront-content');
  },

  async saveContent(content) {
    return apiClient.post<BackendStorefrontContentDto>('/api/admin/storefront-content', content);
  },
};
