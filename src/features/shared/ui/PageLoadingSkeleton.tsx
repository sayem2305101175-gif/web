import * as React from 'react';
import { UISurfaceCard } from './primitives';

const PageLoadingSkeleton: React.FC = () => (
  <div className="relative overflow-hidden px-4 pb-16 pt-24 md:px-6">
    <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[36rem] bg-[radial-gradient(circle_at_top_left,_rgba(212,175,55,0.18),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_35%),linear-gradient(180deg,_#f7f2eb_0%,_#ffffff_65%)]" />

    <section className="mx-auto max-w-7xl animate-pulse">
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <div className="h-3 w-28 rounded-full bg-zinc-200" />
        <div className="h-3 w-20 rounded-full bg-zinc-100" />
      </div>

      <UISurfaceCard className="rounded-[2.5rem] p-8 md:p-10">
        <div className="h-5 w-36 rounded-full bg-zinc-100" />
        <div className="mt-5 h-12 max-w-2xl rounded-[1.5rem] bg-zinc-200" />
        <div className="mt-4 h-4 max-w-3xl rounded-full bg-zinc-100" />
        <div className="mt-3 h-4 max-w-2xl rounded-full bg-zinc-100" />

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="rounded-[2rem] border border-zinc-100 bg-white p-5">
              <div className="h-44 rounded-[1.5rem] bg-zinc-100" />
              <div className="mt-5 h-3 w-20 rounded-full bg-zinc-100" />
              <div className="mt-3 h-8 w-3/4 rounded-[1rem] bg-zinc-200" />
              <div className="mt-3 h-4 w-full rounded-full bg-zinc-100" />
              <div className="mt-2 h-4 w-5/6 rounded-full bg-zinc-100" />
            </div>
          ))}
        </div>
      </UISurfaceCard>
    </section>
  </div>
);

export default PageLoadingSkeleton;
