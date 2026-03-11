
import { SHOES } from '../constants';
import { Shoe } from '../types';
import { ApiError, apiClient, isBackendConfigured } from './apiClient';

/**
 * Service to handle shoe data fetching.
 * Uses backend API when configured and local data during standalone frontend previews.
 */
export const shoeService = {
  async getAllShoes(): Promise<Shoe[]> {
    if (!isBackendConfigured) {
      await delay(200);
      return [...SHOES];
    }

    return apiClient.get<Shoe[]>('/api/shoes');
  },

  async getShoeById(id: string): Promise<Shoe | undefined> {
    if (!isBackendConfigured) {
      await delay(120);
      return SHOES.find((shoe) => shoe.id === id);
    }

    try {
      return await apiClient.get<Shoe>(`/api/shoes/${encodeURIComponent(id)}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return undefined;
      }

      throw error;
    }
  },

  async getShoesByBrand(brand: string): Promise<Shoe[]> {
    if (!isBackendConfigured) {
      await delay(180);
      if (brand === 'All') {
        return [...SHOES];
      }

      return SHOES.filter((shoe) => shoe.brand === brand);
    }

    return apiClient.get<Shoe[]>('/api/shoes', {
      brand: brand === 'All' ? undefined : brand,
    });
  },

  async getNewArrivals(): Promise<Shoe[]> {
    if (!isBackendConfigured) {
      await delay(160);
      return SHOES.filter((shoe) => Boolean(shoe.isNew));
    }

    return apiClient.get<Shoe[]>('/api/shoes', { newArrivals: true });
  },
};

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
