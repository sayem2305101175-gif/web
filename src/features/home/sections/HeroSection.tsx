import React from 'react';
import { Shoe } from '../../../types';
import type { StorefrontContentSnapshot } from '../../../content/storefront';

interface HeroSectionProps {
  cartCount: number;
  cartTotal: number;
  featuredDrop: Shoe | null;
  featuredDropContent: StorefrontContentSnapshot['featuredDrop'];
  heroContent: StorefrontContentSnapshot['hero'];
  lowStockCount: number;
  onOpenCollection: () => void;
  onOpenFeaturedDrop: () => void;
  onOpenPromise: () => void;
  styleCount: number;
  wishlistCount: number;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  cartCount,
  cartTotal,
  featuredDrop,
  featuredDropContent,
  heroContent,
  lowStockCount,
  onOpenCollection,
  onOpenFeaturedDrop,
  onOpenPromise,
  styleCount,
  wishlistCount,
}) => {
  return (
    <section className="mx-auto max-w-7xl">
      <div className="rounded-full border border-white/70 bg-white/70 px-5 py-3 text-center text-[10px] font-black uppercase tracking-[0.35em] text-zinc-600 shadow-[0_10px_25px_rgba(15,23,42,0.04)] backdrop-blur">
        {heroContent.stripText}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr,0.85fr]">
        <div className="rounded-[3rem] border border-white/80 bg-[rgba(255,255,255,0.76)] p-8 shadow-[0_24px_80px_rgba(15,23,42,0.07)] backdrop-blur md:p-12">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">{heroContent.eyebrow}</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-black leading-[0.92] tracking-tight text-zinc-950 md:text-7xl">{heroContent.headline}</h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-600 md:text-lg">{heroContent.description}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={onOpenCollection}
              className="rounded-full bg-zinc-950 px-6 py-4 text-sm font-black uppercase tracking-[0.25em] text-white shadow-[0_18px_40px_rgba(15,23,42,0.16)]"
            >
              {heroContent.primaryCtaLabel}
            </button>
            <button
              onClick={onOpenPromise}
              className="rounded-full border border-zinc-200 bg-white px-6 py-4 text-sm font-black uppercase tracking-[0.25em] text-zinc-950"
            >
              {heroContent.secondaryCtaLabel}
            </button>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-[2rem] border border-zinc-200 bg-white p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">Styles</p>
              <p className="mt-2 text-3xl font-black tracking-tight text-zinc-950">{styleCount}</p>
            </div>
            <div className="rounded-[2rem] border border-zinc-200 bg-white p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">In bag</p>
              <p className="mt-2 text-3xl font-black tracking-tight text-zinc-950">{cartCount}</p>
            </div>
            <div className="rounded-[2rem] border border-zinc-200 bg-white p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">Saved</p>
              <p className="mt-2 text-3xl font-black tracking-tight text-zinc-950">{wishlistCount}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="overflow-hidden rounded-[3rem] border border-white/80 bg-zinc-950 p-7 text-white shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-300">Featured drop</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">{featuredDrop?.name ?? featuredDropContent.fallbackName}</h2>
            <p className="mt-3 text-sm leading-7 text-zinc-300">
              {featuredDrop?.featuredNote ?? featuredDropContent.fallbackBody}
            </p>
            <div className="mt-6 rounded-[2rem] bg-white/8 p-5">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-300">
                    {featuredDrop?.brand ?? 'Velosnak Atelier'}
                  </p>
                  <p className="mt-2 text-4xl font-black tracking-tight">{featuredDrop ? `$${featuredDrop.price}` : '--'}</p>
                </div>
                <span className="rounded-full bg-white/12 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em]">
                  {featuredDrop?.stockStatus ?? 'Waitlist'}
                </span>
              </div>
              <button
                onClick={onOpenFeaturedDrop}
                disabled={!featuredDrop}
                className="mt-6 w-full rounded-full bg-white px-5 py-3 text-sm font-black uppercase tracking-[0.25em] text-zinc-950"
              >
                {featuredDropContent.actionLabel}
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
  );
};

export default HeroSection;
