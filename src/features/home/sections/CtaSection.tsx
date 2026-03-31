import React from 'react';
import type { StorefrontContentSnapshot } from '../../../content/storefront';

interface CtaSectionProps {
  ctaContent: StorefrontContentSnapshot['cta'];
  onOpenCart: () => void;
}

const CtaSection: React.FC<CtaSectionProps> = ({ ctaContent, onOpenCart }) => {
  return (
    <section className="mx-auto mt-20 max-w-7xl">
      <div className="rounded-[3rem] border border-zinc-200 bg-[linear-gradient(135deg,_rgba(15,23,42,0.97),_rgba(40,40,52,0.96))] px-8 py-10 text-white shadow-[0_24px_80px_rgba(15,23,42,0.2)] md:px-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-300">{ctaContent.eyebrow}</p>
            <h2 className="mt-3 max-w-2xl text-4xl font-black tracking-tight">{ctaContent.headline}</h2>
          </div>
          <button
            onClick={onOpenCart}
            className="rounded-full bg-white px-6 py-4 text-sm font-black uppercase tracking-[0.25em] text-zinc-950"
          >
            {ctaContent.buttonLabel}
          </button>
        </div>

        <div className="mt-10 flex flex-wrap gap-4 text-sm font-medium text-zinc-300">
          {ctaContent.chips.map((item) => (
            <span key={item} className="rounded-full border border-white/12 px-4 py-2">
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
