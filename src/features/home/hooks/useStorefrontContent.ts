import * as React from 'react';
import {
  STOREFRONT_CONTENT_STORAGE_KEY,
  getDefaultStorefrontContentSnapshot,
  type StorefrontContentSnapshot,
} from '../../../content/storefront';
import { storefrontContentRepository } from '../../commerce/repositories';

interface UseStorefrontContentResult {
  content: StorefrontContentSnapshot;
}

export const useStorefrontContent = (): UseStorefrontContentResult => {
  const [content, setContent] = React.useState<StorefrontContentSnapshot>(() => getDefaultStorefrontContentSnapshot());

  React.useEffect(() => {
    let isActive = true;

    const refreshContent = async () => {
      const snapshot = await storefrontContentRepository.getContent();
      if (!isActive) {
        return;
      }
      setContent(snapshot);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key !== STOREFRONT_CONTENT_STORAGE_KEY) {
        return;
      }
      void refreshContent();
    };

    void refreshContent();
    window.addEventListener('storage', handleStorage);
    const unsubscribe = storefrontContentRepository.subscribe?.(() => {
      void refreshContent();
    });

    return () => {
      isActive = false;
      unsubscribe?.();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return {
    content,
  };
};
