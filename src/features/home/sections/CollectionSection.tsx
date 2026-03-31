import React from 'react';
import ThreeDShoeCard from '../../catalog/components/ThreeDShoeCard';
import ShoeCardSkeleton from '../../catalog/components/ShoeCardSkeleton';
import { Shoe } from '../../../types';

interface CollectionSectionProps {
  brands: string[];
  catalogError: string | null;
  filter: string;
  filteredShoes: Shoe[];
  loading: boolean;
  onSelectShoe: (shoe: Shoe) => void;
  searchQuery: string;
  setFilter: (filter: string) => void;
}

const CollectionSection: React.FC<CollectionSectionProps> = ({
  brands,
  catalogError,
  filter,
  filteredShoes,
  loading,
  onSelectShoe,
  searchQuery,
  setFilter,
}) => {
  return (
    <section id="collection" className="mx-auto mt-20 max-w-7xl">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">Collection</p>
          <h2 className="mt-2 text-4xl font-black tracking-tight text-zinc-950">
            {searchQuery ? 'Search results' : filter === 'All' ? 'Shop the collection' : filter}
          </h2>
        </div>
        <p className="text-sm font-medium text-zinc-500">
          {loading ? 'Loading styles...' : `${filteredShoes.length} styles available`}
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          onClick={() => setFilter('New Arrivals')}
          className={`rounded-full px-5 py-3 text-[11px] font-black uppercase tracking-[0.25em] transition ${
            filter === 'New Arrivals'
              ? 'bg-zinc-950 text-white'
              : 'border border-zinc-200 bg-white text-zinc-600 hover:text-zinc-950'
          }`}
        >
          New Arrivals
        </button>
        {brands.map((brand) => (
          <button
            key={brand}
            onClick={() => setFilter(brand)}
            className={`rounded-full px-5 py-3 text-[11px] font-black uppercase tracking-[0.25em] transition ${
              filter === brand
                ? 'bg-zinc-950 text-white'
                : 'border border-zinc-200 bg-white text-zinc-600 hover:text-zinc-950'
            }`}
          >
            {brand}
          </button>
        ))}
      </div>

      <div className="mt-10 min-h-[420px]">
        {loading ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <ShoeCardSkeleton key={item} />
            ))}
          </div>
        ) : catalogError ? (
          <div className="rounded-[2.5rem] border border-rose-200 bg-rose-50 p-12 text-center">
            <p className="text-xl font-black tracking-tight text-zinc-950">Collection unavailable.</p>
            <p className="mt-3 text-sm leading-7 text-rose-700">{catalogError}</p>
          </div>
        ) : filteredShoes.length === 0 ? (
          <div className="rounded-[2.5rem] border border-dashed border-zinc-300 bg-white/70 p-12 text-center">
            <p className="text-xl font-black tracking-tight text-zinc-950">No styles matched your search.</p>
            <p className="mt-3 text-sm leading-7 text-zinc-600">
              Try a brand name, category, or colorway to widen the results.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredShoes.map((shoe) => (
              <ThreeDShoeCard key={shoe.id} shoe={shoe} onClick={onSelectShoe} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CollectionSection;
