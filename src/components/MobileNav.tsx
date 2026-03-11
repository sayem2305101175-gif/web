import * as React from 'react';
import { SHOES } from '../constants';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  setFilter: (filter: string) => void;
  activeFilter: string;
  onOpenCart: () => void;
  onOpenProfile: () => void;
}

const MobileNav: React.FC<MobileNavProps> = ({
  isOpen,
  onClose,
  setFilter,
  activeFilter,
  onOpenCart,
  onOpenProfile,
}) => {
  const brands = ['All', 'New Arrivals', ...new Set(SHOES.map((shoe) => shoe.brand))];

  const goToCollection = (brand: string) => {
    setFilter(brand);
    onClose();
    document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed top-0 left-0 bottom-0 z-[101] w-[88%] max-w-sm border-r border-zinc-100 bg-[rgba(250,247,242,0.98)] shadow-2xl transition-transform duration-500 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col p-8">
          <div className="mb-12 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
                Curated Footwear
              </p>
              <p className="text-2xl font-black tracking-tight text-zinc-950">Velosnak Atelier</p>
            </div>
            <button
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-500"
              aria-label="Close navigation"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-2">
            <p className="mb-4 text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">
              Shop by brand
            </p>
            {brands.map((brand) => (
              <button
                key={brand}
                onClick={() => goToCollection(brand)}
                className={`w-full rounded-2xl px-5 py-4 text-left text-sm font-black uppercase tracking-[0.22em] transition ${
                  activeFilter === brand
                    ? 'bg-zinc-950 text-white shadow-[0_18px_40px_rgba(15,23,42,0.15)]'
                    : 'bg-white text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950'
                }`}
              >
                {brand}
              </button>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-1 gap-3">
            <button
              onClick={() => {
                onClose();
                onOpenCart();
              }}
              className="rounded-3xl bg-zinc-950 px-5 py-4 text-left text-white shadow-[0_18px_40px_rgba(15,23,42,0.15)]"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-300">Bag</p>
              <p className="mt-1 text-lg font-black">View bag</p>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenProfile();
              }}
              className="rounded-3xl border border-zinc-200 bg-white px-5 py-4 text-left text-zinc-950"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">Account</p>
              <p className="mt-1 text-lg font-black">Saved styles and orders</p>
            </button>
          </div>

          <div className="mt-auto rounded-[2rem] border border-zinc-200 bg-white p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">
              Store promise
            </p>
            <p className="mt-2 text-lg font-black tracking-tight text-zinc-950">
              Free shipping over $300 and simple size exchanges.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileNav;
