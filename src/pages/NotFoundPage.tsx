import * as React from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../features/shared/hooks/useDocumentTitle';
import CommerceRouteHeader from '../features/shared/ui/CommerceRouteHeader';
import { UISurfaceCard } from '../features/shared/ui/primitives';

const NotFoundPage: React.FC = () => {
  useDocumentTitle('Not Found | Velosnak Atelier');

  return (
    <div className="relative overflow-hidden px-4 pb-16 pt-24 md:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[36rem] bg-[radial-gradient(circle_at_top_left,_rgba(212,175,55,0.18),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_35%),linear-gradient(180deg,_#f7f2eb_0%,_#ffffff_65%)]" />

      <CommerceRouteHeader
        eyebrow="Route fallback"
        title="Page not found"
        subtitle="The route you opened does not exist in this storefront. Use the collection links below to jump back into the catalog."
      />

      <UISurfaceCard className="mx-auto max-w-7xl rounded-[2.5rem] p-8 md:p-10">
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">404</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-zinc-950">This page is outside the storefront map.</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-600">
          The link may be outdated, incomplete, or removed during a catalog update. Head back to the collection and pick up from a live route.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/collection"
            className="inline-flex rounded-full bg-zinc-950 px-5 py-3 text-xs font-black uppercase tracking-[0.25em] text-white"
          >
            Back to collection
          </Link>
          <Link
            to="/"
            className="inline-flex rounded-full border border-zinc-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.25em] text-zinc-700 transition hover:text-zinc-950"
          >
            Return home
          </Link>
        </div>
      </UISurfaceCard>
    </div>
  );
};

export default NotFoundPage;
