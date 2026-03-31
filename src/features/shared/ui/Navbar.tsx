import * as React from 'react';
import MobileNav from './MobileNav';
import { useCart } from '../../cart/context/useCart';
import { useWishlist } from '../../wishlist/context/useWishlist';
import { scrollToSection } from '../utils/scrollToSection';

interface NavbarProps {
  filter: string;
  setFilter: (filter: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (isOpen: boolean) => void;
  onOpenProfile: () => void;
  onOpenCart: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  filter,
  setFilter,
  searchQuery,
  setSearchQuery,
  isSearchOpen,
  setIsSearchOpen,
  onOpenProfile,
  onOpenCart,
}) => {
  const desktopInputRef = React.useRef<HTMLInputElement>(null);
  const mobileInputRef = React.useRef<HTMLInputElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { cartCount } = useCart();
  const { wishlist } = useWishlist();

  React.useEffect(() => {
    if (!isSearchOpen) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      mobileInputRef.current?.focus();
      desktopInputRef.current?.focus();
    }, 120);

    return () => window.clearTimeout(timeoutId);
  }, [isSearchOpen]);

  const resetCollection = () => {
    setFilter('All');
    setSearchQuery('');
    setIsSearchOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/60 bg-[rgba(250,247,242,0.88)] backdrop-blur-xl shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-900 transition hover:border-zinc-300 md:hidden"
              aria-label="Open navigation"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>

            <button
              onClick={resetCollection}
              className="flex items-center gap-3 transition hover:opacity-80"
              aria-label="Go to home"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-950 text-xs font-black tracking-[0.35em] text-white">
                VS
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">
                  Curated Footwear
                </p>
                <p className="text-xl font-black tracking-tight text-zinc-950">Velosnak Atelier</p>
              </div>
            </button>
          </div>

          <div className="hidden items-center gap-8 md:flex">
            <button
              onClick={() => {
                setFilter('New Arrivals');
                scrollToSection('collection');
              }}
              className={`text-xs font-black uppercase tracking-[0.3em] transition ${
                filter === 'New Arrivals' ? 'text-zinc-950' : 'text-zinc-500 hover:text-zinc-950'
              }`}
            >
              New Arrivals
            </button>
            <button
              onClick={() => {
                setFilter('All');
                scrollToSection('collection');
              }}
              className={`text-xs font-black uppercase tracking-[0.3em] transition ${
                filter === 'All' && !searchQuery ? 'text-zinc-950' : 'text-zinc-500 hover:text-zinc-950'
              }`}
            >
              Collection
            </button>
            <button
              onClick={() => scrollToSection('promise')}
              className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 transition hover:text-zinc-950"
            >
              Why Shop Us
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 transition hover:text-zinc-950"
            >
              FAQ
            </button>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <div
              className={`relative hidden overflow-hidden transition-all duration-300 md:block ${
                isSearchOpen ? 'w-72 opacity-100' : 'w-0 opacity-0 pointer-events-none'
              }`}
            >
              <div className="relative">
                <input
                  ref={desktopInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by name, brand, or color"
                  className="w-full rounded-full border border-zinc-200 bg-white px-5 py-3 pr-10 text-sm font-medium text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-950"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-zinc-100 p-1 text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-950"
                    aria-label="Clear search"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`flex h-11 w-11 items-center justify-center rounded-full border transition ${
                isSearchOpen
                  ? 'border-zinc-950 bg-zinc-950 text-white'
                  : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:text-zinc-950'
              }`}
              aria-label={isSearchOpen ? 'Close search' : 'Open search'}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={isSearchOpen ? 'M6 18L18 6M6 6l12 12' : 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'}
                />
              </svg>
            </button>

            <button
              onClick={onOpenProfile}
              className="hidden items-center gap-3 rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-left transition hover:border-zinc-300 md:flex"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-950 text-[11px] font-black uppercase tracking-[0.2em] text-white">
                {wishlist.length}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">Account</p>
                <p className="text-sm font-bold text-zinc-950">Saved styles</p>
              </div>
            </button>

            <button
              onClick={onOpenCart}
              className="flex items-center gap-3 rounded-full bg-zinc-950 px-4 py-2.5 text-white shadow-[0_12px_30px_rgba(15,23,42,0.15)] transition hover:translate-y-[-1px]"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/12 text-[11px] font-black uppercase tracking-[0.2em]">
                {cartCount}
              </div>
              <div className="hidden text-left md:block">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-300">Bag</p>
                <p className="text-sm font-bold text-white">Checkout</p>
              </div>
            </button>
          </div>
        </div>

        {isSearchOpen ? (
          <div className="border-t border-white/60 px-4 pb-4 md:hidden">
            <div className="mx-auto max-w-7xl">
              <div className="relative pt-4">
                <input
                  ref={mobileInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by name, brand, or color"
                  className="w-full rounded-[1.75rem] border border-zinc-200 bg-white px-5 py-4 pr-12 text-sm font-medium text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-950"
                />
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-[1.4rem] rounded-full bg-zinc-100 p-1.5 text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-950"
                    aria-label="Clear search"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </nav>

      <MobileNav
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        setFilter={setFilter}
        activeFilter={filter}
        onOpenCart={onOpenCart}
        onOpenProfile={onOpenProfile}
      />
    </>
  );
};

export default Navbar;
