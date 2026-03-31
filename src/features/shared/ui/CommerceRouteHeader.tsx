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
      <UISurfaceCard tone="glass" className="flex flex-col gap-5 p-6 md:p-8">
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
