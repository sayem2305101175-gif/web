import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Shoe } from '../types';
import { shoeService } from '../features/catalog/services/shoeService';
import { storefrontCatalogRepository } from '../features/commerce/repositories';
import { useHomeCatalog } from '../features/home/hooks/useHomeCatalog';
import CollectionSection from '../features/home/sections/CollectionSection';
import CommerceRouteHeader from '../features/shared/ui/CommerceRouteHeader';

const CollectionPage: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = React.useState('All');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [catalogSnapshot, setCatalogSnapshot] = React.useState<Shoe[]>([]);
  const { catalogError, filteredShoes, loading } = useHomeCatalog(filter, searchQuery);

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

  return (
    <div className="relative overflow-hidden px-4 pb-16 pt-24 md:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[36rem] bg-[radial-gradient(circle_at_top_left,_rgba(212,175,55,0.18),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_35%),linear-gradient(180deg,_#f7f2eb_0%,_#ffffff_65%)]" />

      <CommerceRouteHeader
        eyebrow="Route-backed browsing"
        title="Collection"
        subtitle="Browse the full catalog with filters and search, then jump to direct product URLs for full details."
      />

      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-[2rem] border border-zinc-200 bg-white px-5 py-4">
          <label className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">Search catalog</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by name, brand, category, or colorway"
            className="mt-3 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-950"
          />
        </div>
      </div>

      <CollectionSection
        brands={brands}
        catalogError={catalogError}
        filter={filter}
        filteredShoes={filteredShoes}
        loading={loading}
        onSelectShoe={(shoe) => navigate(`/product/${encodeURIComponent(shoe.id)}`)}
        searchQuery={searchQuery}
        setFilter={setFilter}
      />
    </div>
  );
};

export default CollectionPage;
