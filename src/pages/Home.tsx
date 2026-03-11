import React from 'react';
import { Shoe } from '../types';
import ThreeDShoeCard from '../components/ThreeDShoeCard';
import ShoeCardSkeleton from '../components/ShoeCardSkeleton';
import Navbar from '../components/Navbar';
import { isBackendConfigured } from '../services/apiClient';
import { shoeService } from '../services/shoeService';
import { SHOES } from '../constants';
import { useCart } from '../context/useCart';
import { useWishlist } from '../context/useWishlist';
import { BUYING_STEPS, FAQS, FOOTER_LINKS, STORE_PROMISES } from '../content/storefront';

const ShoeModal = React.lazy(() => import('../components/ShoeModal'));
const ProfileModal = React.lazy(() => import('../components/ProfileModal'));
const CartDrawer = React.lazy(() => import('../components/CartDrawer'));

const Home: React.FC = () => {
  const [shoes, setShoes] = React.useState<Shoe[]>([]);
  const [catalogError, setCatalogError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [selectedShoe, setSelectedShoe] = React.useState<Shoe | null>(null);
  const [filter, setFilter] = React.useState('All');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const [isCartOpen, setIsCartOpen] = React.useState(false);
  const deferredSearchQuery = React.useDeferredValue(searchQuery);
  const { cartCount, cartTotal } = useCart();
  const { wishlist } = useWishlist();

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setCatalogError(null);

      try {
        const data =
          filter === 'New Arrivals'
            ? await shoeService.getNewArrivals()
            : await shoeService.getShoesByBrand(filter);

        setShoes(data);
      } catch (error) {
        console.error('Failed to fetch shoes:', error);
        setShoes([]);
        setCatalogError(resolveCatalogErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
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

  const brands = React.useMemo(() => ['All', ...new Set(SHOES.map((shoe) => shoe.brand))], []);
  const featuredDrop = React.useMemo(() => SHOES.find((shoe) => shoe.id === '6') ?? SHOES[0], []);
  const lowStockCount = React.useMemo(
    () => SHOES.filter((shoe) => shoe.stockStatus !== 'In stock').length,
    []
  );

  return (
    <div className="relative overflow-hidden px-4 pb-12 pt-32 md:px-6 md:pt-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[40rem] bg-[radial-gradient(circle_at_top_left,_rgba(212,175,55,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.14),_transparent_35%),linear-gradient(180deg,_#f7f2eb_0%,_#ffffff_62%)]" />

      <Navbar
        filter={filter}
        setFilter={setFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isSearchOpen={isSearchOpen}
        setIsSearchOpen={setIsSearchOpen}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
      />

      <section className="mx-auto max-w-7xl">
        {!isBackendConfigured ? (
          <div className="mb-6 rounded-[2rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900 shadow-[0_10px_25px_rgba(15,23,42,0.04)]">
            This public deployment is running in storefront preview mode. Product browsing works normally, and live
            checkout becomes available after a backend URL is set in `VITE_API_BASE_URL`.
          </div>
        ) : null}

        <div className="rounded-full border border-white/70 bg-white/70 px-5 py-3 text-center text-[10px] font-black uppercase tracking-[0.35em] text-zinc-600 shadow-[0_10px_25px_rgba(15,23,42,0.04)] backdrop-blur">
          Free shipping over $300 · 14-day size exchange · new arrivals weekly
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr,0.85fr]">
          <div className="rounded-[3rem] border border-white/80 bg-[rgba(255,255,255,0.76)] p-8 shadow-[0_24px_80px_rgba(15,23,42,0.07)] backdrop-blur md:p-12">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Curated sneaker boutique</p>
            <h1 className="mt-4 max-w-4xl text-5xl font-black leading-[0.92] tracking-tight text-zinc-950 md:text-7xl">
              Modern sneakers with premium finish and easy everyday wear.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-600 md:text-lg">
              Explore a tighter edit of standout pairs, from clean runners to bold statement styles. Every product page includes clear sizing, delivery timing, and saved-item support.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' })}
                className="rounded-full bg-zinc-950 px-6 py-4 text-sm font-black uppercase tracking-[0.25em] text-white shadow-[0_18px_40px_rgba(15,23,42,0.16)]"
              >
                Shop collection
              </button>
              <button
                onClick={() => document.getElementById('promise')?.scrollIntoView({ behavior: 'smooth' })}
                className="rounded-full border border-zinc-200 bg-white px-6 py-4 text-sm font-black uppercase tracking-[0.25em] text-zinc-950"
              >
                Why shop here
              </button>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <div className="rounded-[2rem] border border-zinc-200 bg-white p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">Styles</p>
                <p className="mt-2 text-3xl font-black tracking-tight text-zinc-950">{SHOES.length}</p>
              </div>
              <div className="rounded-[2rem] border border-zinc-200 bg-white p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">In bag</p>
                <p className="mt-2 text-3xl font-black tracking-tight text-zinc-950">{cartCount}</p>
              </div>
              <div className="rounded-[2rem] border border-zinc-200 bg-white p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">Saved</p>
                <p className="mt-2 text-3xl font-black tracking-tight text-zinc-950">{wishlist.length}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="overflow-hidden rounded-[3rem] border border-white/80 bg-zinc-950 p-7 text-white shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-300">Featured drop</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">{featuredDrop.name}</h2>
              <p className="mt-3 text-sm leading-7 text-zinc-300">{featuredDrop.featuredNote}</p>
              <div className="mt-6 rounded-[2rem] bg-white/8 p-5">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-300">{featuredDrop.brand}</p>
                    <p className="mt-2 text-4xl font-black tracking-tight">${featuredDrop.price}</p>
                  </div>
                  <span className="rounded-full bg-white/12 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em]">
                    {featuredDrop.stockStatus}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedShoe(featuredDrop)}
                  className="mt-6 w-full rounded-full bg-white px-5 py-3 text-sm font-black uppercase tracking-[0.25em] text-zinc-950"
                >
                  View product
                </button>
              </div>
            </div>

            <div className="rounded-[3rem] border border-zinc-200 bg-white p-7">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">Store details</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-3xl font-black tracking-tight text-zinc-950">${cartTotal}</p>
                  <p className="mt-1 text-sm text-zinc-500">Current bag total</p>
                </div>
                <div>
                  <p className="text-3xl font-black tracking-tight text-zinc-950">{lowStockCount}</p>
                  <p className="mt-1 text-sm text-zinc-500">Limited-stock styles</p>
                </div>
                <div>
                  <p className="text-3xl font-black tracking-tight text-zinc-950">14d</p>
                  <p className="mt-1 text-sm text-zinc-500">Size exchange window</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="promise" className="mx-auto mt-16 max-w-7xl">
        <div className="mb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">Why shop here</p>
          <h2 className="mt-2 text-4xl font-black tracking-tight text-zinc-950">Designed to feel clear, calm, and premium from the first click.</h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {STORE_PROMISES.map((promise) => (
            <div key={promise.title} className="rounded-[2.25rem] border border-zinc-200 bg-white p-7 shadow-[0_20px_40px_rgba(15,23,42,0.04)]">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">{promise.eyebrow}</p>
              <h3 className="mt-4 text-2xl font-black tracking-tight text-zinc-950">{promise.title}</h3>
              <p className="mt-4 text-sm leading-7 text-zinc-600">{promise.body}</p>
            </div>
          ))}
        </div>
      </section>

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
                <ThreeDShoeCard key={shoe.id} shoe={shoe} onClick={setSelectedShoe} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
          <div className="rounded-[3rem] border border-zinc-200 bg-zinc-950 p-8 text-white">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-300">How it works</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight">A simple path from product page to checkout.</h2>
            <p className="mt-5 text-sm leading-7 text-zinc-300">
              Browse the collection, choose your size, and check out with delivery details in one place. The flow is made to feel simple from start to finish.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {BUYING_STEPS.map((step, index) => (
              <div key={step.title} className="rounded-[2.25rem] border border-zinc-200 bg-white p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">Step {index + 1}</p>
                <h3 className="mt-4 text-2xl font-black tracking-tight text-zinc-950">{step.title}</h3>
                <p className="mt-4 text-sm leading-7 text-zinc-600">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto mt-20 max-w-7xl">
        <div className="mb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">FAQ</p>
          <h2 className="mt-2 text-4xl font-black tracking-tight text-zinc-950">Questions we hear most.</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {FAQS.map((item) => (
            <div key={item.question} className="rounded-[2rem] border border-zinc-200 bg-white p-6">
              <h3 className="text-xl font-black tracking-tight text-zinc-950">{item.question}</h3>
              <p className="mt-4 text-sm leading-7 text-zinc-600">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-7xl">
        <div className="rounded-[3rem] border border-zinc-200 bg-[linear-gradient(135deg,_rgba(15,23,42,0.97),_rgba(40,40,52,0.96))] px-8 py-10 text-white shadow-[0_24px_80px_rgba(15,23,42,0.2)] md:px-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-300">Ready to choose your pair?</p>
              <h2 className="mt-3 max-w-2xl text-4xl font-black tracking-tight">
                Clean silhouettes, fast delivery, and easy size support across the full collection.
              </h2>
            </div>
            <button
              onClick={() => setIsCartOpen(true)}
              className="rounded-full bg-white px-6 py-4 text-sm font-black uppercase tracking-[0.25em] text-zinc-950"
            >
              Open bag
            </button>
          </div>

          <div className="mt-10 flex flex-wrap gap-4 text-sm font-medium text-zinc-300">
            {FOOTER_LINKS.map((item) => (
              <span key={item} className="rounded-full border border-white/12 px-4 py-2">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto mt-16 max-w-7xl border-t border-zinc-200 py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">Velosnak Atelier</p>
            <p className="mt-2 text-sm text-zinc-500">Curated sneakers for daily wear and standout moments.</p>
          </div>
          <p className="text-sm font-medium text-zinc-500">Clean product pages, clear delivery, and a simpler shopping flow.</p>
        </div>
      </footer>

      <React.Suspense fallback={null}>
        {selectedShoe ? <ShoeModal shoe={selectedShoe} onClose={() => setSelectedShoe(null)} /> : null}
        {isProfileOpen ? (
          <ProfileModal
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
            onShoeClick={(shoe) => {
              setIsProfileOpen(false);
              setSelectedShoe(shoe);
            }}
          />
        ) : null}
        {isCartOpen ? <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} /> : null}
      </React.Suspense>
    </div>
  );
};

export default Home;

function resolveCatalogErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return 'The catalog could not be loaded from the backend.';
}
