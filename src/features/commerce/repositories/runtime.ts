import { isBackendConfigured } from '../../../services/apiClient';

export type CommerceRepositoryMode = 'local-preview' | 'backend';

export interface CommerceRepositoryAdapters<T> {
  backend: T;
  localPreview: T;
}

export const resolveCommerceRepositoryMode = (): CommerceRepositoryMode =>
  isBackendConfigured ? 'backend' : 'local-preview';

export const selectCommerceRepositoryAdapter = <T>(adapters: CommerceRepositoryAdapters<T>): T =>
  resolveCommerceRepositoryMode() === 'backend' ? adapters.backend : adapters.localPreview;
