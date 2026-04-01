import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Shoe } from '../types';
import { shoeService } from '../features/catalog/services/shoeService';
import { storefrontCatalogRepository } from '../features/commerce/repositories';
import { useHomeCatalog } from '../features/home/hooks/useHomeCatalog';
import CollectionSection from '../features/home/sections/CollectionSection';
import { useDocumentTitle } from '../features/shared/hooks/useDocumentTitle';
import CommerceRouteHeader from '../features/shared/ui/CommerceRouteHeader';

type CollectionSortOption = 'price-asc' | 'price-desc' | 'name-asc' | 'newest';

const COLLECTION_PAGE_SIZE = 12;

const CollectionPage: React.FC = () => {
  useDocumentTitle('Collection | Velosnak Atelier');

  const navigate = useNavigate();
  const [filter, setFilter] = React.useState('All');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortBy, setSortBy] = React.useState<CollectionSortOption>('newest');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [catalogSnapshot, setCatalogSnapshot] = React.useState<Shoe[]>([]);
  const { catalogError, filteredShoes, loading, retryCatalog } = useHomeCatalog(filter, searchQuery);

  React.useEffect(() => {
    let isMounted = true;

    const loadCatalogSnapshot = async () => {
      try {
        const products = await shoeService.getAllShoes();
        if (!isMounted) {
          return;
        }
        setCatalogSnapshot(products);
      } catch {
        if (!isMounted) {
          return;
        }
        setCatalogSnapshot([]);
      }
    };

    void loadCatalogSnapshot();
    const unsubscribe = storefrontCatalogRepository.subscribe?.(() => {
      void loadCatalogSnapshot();
    });

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, []);

  const brands = React.useMemo(() => ['All', ...new Set(catalogSnapshot.map((shoe) => shoe.brand))], [catalogSnapshot]);
  const sortedShoes = React.useMemo(() => {
    const shoes = [...filteredShoes];

    switch (sortBy) {
      case 'price-asc':
        return shoes.sort((firstShoe, secondShoe) => firstShoe.price - secondShoe.price || firstShoe.name.localeCompare(secondShoe.name));
      case 'price-desc':
        return shoes.sort((firstShoe, secondShoe) => secondShoe.price - firstShoe.price || firstShoe.name.localeCompare(secondShoe.name));
      case 'name-asc':
        return shoes.sort((firstShoe, secondShoe) => firstShoe.name.localeCompare(secondShoe.name));
      case 'newest':
      default:
        return shoes.sort((firstShoe, secondShoe) => {
          const firstScore = Number(Boolean(firstShoe.isNew));
          const secondScore = Number(Boolean(secondShoe.isNew));
          return secondScore - firstScore || firstShoe.name.localeCompare(secondShoe.name);
        });
    }
  }, [filteredShoes, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedShoes.length / COLLECTION_PAGE_SIZE));
  const paginatedShoes = React.useMemo(() => {
    const startIndex = (currentPage - 1) * COLLECTION_PAGE_SIZE;
    return sortedShoes.slice(startIndex, startIndex + COLLECTION_PAGE_SIZE);
  }, [currentPage, sortedShoes]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery, sortBy]);

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="relative overflow-hidden px-4 pb-16 pt-24 md:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[36rem] bg-[radial-gradient(circle_at_top_left,_rgba(212,175,55,0.18),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_35%),linear-gradient(180deg,_#f7f2eb_0%,_#ffffff_65%)]" />

      <CommerceRouteHeader
        eyebrow="Route-backed browsing"
        title="Collection"
        subtitle="Browse the full catalog with filters and search, then jump to direct product URLs for full details."
      />

      <div className="mx-auto max-w-7xl">
        <div className="mb-6 grid gap-4 rounded-[2rem] border border-zinc-200 bg-white px-5 py-4 md:grid-cols-[1fr,16rem]">
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">Search catalog</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by name, brand, category, or colorway"
              className="mt-3 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-950"
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">Sort by</span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as CollectionSortOption)}
              className="mt-3 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 outline-none transition focus:border-zinc-950"
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="name-asc">Name: A to Z</option>
            </select>
          </label>
        </div>
      </div>

      <CollectionSection
        brands={brands}
        catalogError={catalogError}
        currentPage={currentPage}
        filter={filter}
        filteredShoes={paginatedShoes}
        loading={loading}
        onClearFilters={() => {
          setFilter('All');
          setSearchQuery('');
        }}
        onPageChange={setCurrentPage}
        onSelectShoe={(shoe) => navigate(`/product/${encodeURIComponent(shoe.id)}`)}
        onRetry={retryCatalog}
        searchQuery={searchQuery}
        setFilter={setFilter}
        totalPages={totalPages}
        totalResults={sortedShoes.length}
      />
    </div>
  );
};

export default CollectionPage;
