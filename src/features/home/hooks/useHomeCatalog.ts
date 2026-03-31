import * as React from 'react';
import { Shoe } from '../../../types';
import { storefrontCatalogRepository } from '../../commerce/repositories';
import { shoeService } from '../../catalog/services/shoeService';

interface UseHomeCatalogResult {
  catalogError: string | null;
  filteredShoes: Shoe[];
  loading: boolean;
}

export function useHomeCatalog(filter: string, searchQuery: string): UseHomeCatalogResult {
  const [shoes, setShoes] = React.useState<Shoe[]>([]);
  const [catalogError, setCatalogError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const deferredSearchQuery = React.useDeferredValue(searchQuery);

  React.useEffect(() => {
    let isActive = true;

    const fetchData = async (options?: { showLoadingState?: boolean }) => {
      if (options?.showLoadingState !== false) {
        setLoading(true);
      }
      setCatalogError(null);

      try {
        const data =
          filter === 'New Arrivals'
            ? await shoeService.getNewArrivals()
            : await shoeService.getShoesByBrand(filter);

        if (!isActive) {
          return;
        }
        setShoes(data);
      } catch (error) {
        if (!isActive) {
          return;
        }
        console.error('Failed to fetch shoes:', error);
        setShoes([]);
        setCatalogError(resolveCatalogErrorMessage(error));
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void fetchData({ showLoadingState: true });
    const unsubscribe = storefrontCatalogRepository.subscribe?.(() => {
      void fetchData({ showLoadingState: false });
    });

    return () => {
      isActive = false;
      unsubscribe?.();
    };
  }, [filter]);

  const filteredShoes = React.useMemo(() => {
    const searchLower = deferredSearchQuery.trim().toLowerCase();

    if (!searchLower) {
      return shoes;
    }

    return shoes.filter((shoe) => {
      return (
        shoe.name.toLowerCase().includes(searchLower) ||
        shoe.brand.toLowerCase().includes(searchLower) ||
        shoe.colorway.toLowerCase().includes(searchLower) ||
        shoe.category.toLowerCase().includes(searchLower)
      );
    });
  }, [deferredSearchQuery, shoes]);

  return {
    catalogError,
    filteredShoes,
    loading,
  };
}

function resolveCatalogErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return 'The catalog could not be loaded right now.';
}
