import React from 'react';
import type { StorefrontContentSnapshot } from '../../../content/storefront';

interface PromiseSectionProps {
  trustContent: StorefrontContentSnapshot['trust'];
}

const PromiseSection: React.FC<PromiseSectionProps> = ({ trustContent }) => {
  return (
    <section id="promise" className="mx-auto mt-16 max-w-7xl">
      <div className="mb-8">
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">{trustContent.eyebrow}</p>
        <h2 className="mt-2 text-4xl font-black tracking-tight text-zinc-950">{trustContent.headline}</h2>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {trustContent.items.map((promise) => (
          <div
            key={promise.title}
            className="rounded-[2.25rem] border border-zinc-200 bg-white p-7 shadow-[0_20px_40px_rgba(15,23,42,0.04)]"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">{promise.eyebrow}</p>
            <h3 className="mt-4 text-2xl font-black tracking-tight text-zinc-950">{promise.title}</h3>
            <p className="mt-4 text-sm leading-7 text-zinc-600">{promise.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PromiseSection;
