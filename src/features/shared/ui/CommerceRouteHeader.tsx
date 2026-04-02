import * as React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../../cart/context/useCart';
import { useWishlist } from '../../wishlist/context/useWishlist';
import UISurfaceCard from './primitives/UISurfaceCard';

interface CommerceRouteHeaderProps {
  eyebrow: string;
  title: string;
  subtitle: string;
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.25em] transition ${
    isActive ? 'bg-zinc-950 text-white' : 'border border-zinc-200 bg-white text-zinc-600 hover:text-zinc-950'
  }`;

const CommerceRouteHeader: React.FC<CommerceRouteHeaderProps> = ({ eyebrow, title, subtitle }) => {
  const { cartCount } = useCart();
  const { wishlist } = useWishlist();

  return (
    <header className="mx-auto mb-10 mt-6 max-w-7xl">
      <div className="sticky top-0 z-40 mb-6 border-b border-white/60 bg-[rgba(250,247,242,0.88)] backdrop-blur-xl shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="hidden items-center gap-3 md:flex">
            <Link to="/" className="flex items-center gap-3 transition hover:opacity-80" aria-label="Go to home">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-950 text-xs font-black tracking-[0.35em] text-white">
                VS
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">Curated Footwear</p>
                <p className="text-xl font-black tracking-tight text-zinc-950">Velosnak Atelier</p>
              </div>
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <NavLink to="/" className={navLinkClass} end>
              Home
            </NavLink>
            <NavLink to="/collection" className={navLinkClass}>
              Collection
            </NavLink>
            <NavLink to="/wishlist" className={navLinkClass}>
              Wishlist ({wishlist.length})
            </NavLink>
            <NavLink to="/checkout" className={navLinkClass}>
              Checkout ({cartCount})
            </NavLink>
          </div>

          <div className="flex items-center gap-3">
            <NavLink
              to="/wishlist"
              className="hidden items-center gap-3 rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-left transition hover:border-zinc-300 md:flex"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-950 text-[11px] font-black uppercase tracking-[0.2em] text-white">
                {wishlist.length}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">Account</p>
                <p className="text-sm font-bold text-zinc-950">Saved styles</p>
              </div>
            </NavLink>

            <NavLink
              to="/checkout"
              className="hidden items-center gap-3 rounded-full bg-zinc-950 px-4 py-2.5 text-white shadow-[0_12px_30px_rgba(15,23,42,0.15)] transition hover:translate-y-[-1px] md:flex"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/12 text-[11px] font-black uppercase tracking-[0.2em]">
                {cartCount}
              </div>
              <div className="hidden text-left md:block">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-300">Bag</p>
                <p className="text-sm font-bold text-white">Checkout</p>
              </div>
            </NavLink>
          </div>
        </div>
      </div>

      <UISurfaceCard tone="glass" className="flex flex-col gap-3 p-6 md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="ds-type-eyebrow">{eyebrow}</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-zinc-950 md:text-5xl">{title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-600 md:text-base">{subtitle}</p>
          </div>
          <Link
            to="/"
            className="rounded-full border border-zinc-200 bg-white px-5 py-3 text-center text-xs font-black uppercase tracking-[0.25em] text-zinc-700 transition hover:text-zinc-950"
          >
            Back to storefront
          </Link>
        </div>
      </UISurfaceCard>
    </header>
  );
};

export default CommerceRouteHeader;
