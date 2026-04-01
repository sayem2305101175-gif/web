import * as React from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../features/wishlist/context/useWishlist';
import { useDocumentTitle } from '../features/shared/hooks/useDocumentTitle';
import CommerceRouteHeader from '../features/shared/ui/CommerceRouteHeader';

const WishlistPage: React.FC = () => {
  useDocumentTitle('Wishlist | Velosnak Atelier');

  const { wishlist } = useWishlist();

  return (
    <div className="relative overflow-hidden px-4 pb-16 pt-24 md:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(circle_at_top_left,_rgba(244,114,182,0.2),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_35%),linear-gradient(180deg,_#f7f2eb_0%,_#ffffff_70%)]" />

      <CommerceRouteHeader
        eyebrow="Saved products"
        title="Wishlist"
        subtitle="Keep your shortlisted pairs in one place and jump straight into route-backed product detail pages."
      />

      <section className="mx-auto max-w-7xl">
        {wishlist.length === 0 ? (
          <div className="rounded-[2.5rem] border border-dashed border-zinc-300 bg-white/75 p-10 text-center">
            <p className="text-2xl font-black tracking-tight text-zinc-950">No saved styles yet.</p>
            <p className="mt-3 text-sm leading-7 text-zinc-600">
              Browse the collection and save products to build your shortlist.
            </p>
            <Link
              to="/collection"
              className="mt-6 inline-flex rounded-full bg-zinc-950 px-6 py-3 text-xs font-black uppercase tracking-[0.25em] text-white"
            >
              Explore collection
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {wishlist.map((shoe) => (
              <Link
                key={shoe.id}
                to={`/product/${encodeURIComponent(shoe.id)}`}
                className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)] transition hover:border-zinc-300 hover:shadow-[0_24px_60px_rgba(15,23,42,0.08)]"
              >
                <img src={shoe.image} alt={shoe.name} className="h-48 w-full rounded-[1.5rem] bg-zinc-100 object-cover" />
                <p className="mt-5 text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">{shoe.brand}</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-950">{shoe.name}</h2>
                <p className="mt-3 text-sm leading-7 text-zinc-600">{shoe.shortBlurb}</p>
                <p className="mt-4 text-sm font-black uppercase tracking-[0.22em] text-zinc-700">${shoe.price}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default WishlistPage;
