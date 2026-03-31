import type { CommerceRepositoryListener } from './contracts';

export interface RepositorySubscriptionChannel {
  emit: () => void;
  subscribe: (listener: CommerceRepositoryListener) => () => void;
}

export const createRepositorySubscriptionChannel = (): RepositorySubscriptionChannel => {
  const listeners = new Set<CommerceRepositoryListener>();

  return {
    emit() {
      listeners.forEach((listener) => listener());
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
};
