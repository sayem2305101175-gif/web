import React from 'react';
import { Link } from 'react-router-dom';
import type { StorefrontContentSnapshot } from '../../../content/storefront';
import { ADMIN_ROUTE_PATHS } from '../../admin/app/adminRoutes';
import { scrollToSection } from '../../shared/utils/scrollToSection';

interface FooterSectionProps {
  returnsContent: StorefrontContentSnapshot['returns'];
  shippingContent: StorefrontContentSnapshot['shipping'];
}

const FooterSection: React.FC<FooterSectionProps> = ({ returnsContent, shippingContent }) => {
  return (
    <footer className="mx-auto mt-16 max-w-7xl border-t border-zinc-200 py-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">Velosnak Atelier</p>
          <p className="mt-2 text-sm text-zinc-500">Curated sneakers for daily wear and standout moments.</p>
        </div>
        <div className="flex flex-col gap-4 md:items-end">
          <p className="text-sm font-medium text-zinc-500">
            Clean product pages, clear delivery, and a simpler shopping flow.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => scrollToSection('collection')}
              className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.25em] text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-950"
            >
              Collection
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.25em] text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-950"
            >
              FAQ
            </button>
            <Link
              to={ADMIN_ROUTE_PATHS.dashboard}
              className="rounded-full border border-zinc-900 bg-zinc-950 px-4 py-2 text-[11px] font-black uppercase tracking-[0.25em] text-white transition hover:translate-y-[-1px]"
            >
              Open studio
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <article className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">{shippingContent.title}</p>
          <p className="mt-2 text-sm leading-6 text-zinc-600">{shippingContent.message}</p>
        </article>
        <article className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">{returnsContent.title}</p>
          <p className="mt-2 text-sm leading-6 text-zinc-600">{returnsContent.message}</p>
        </article>
      </div>
    </footer>
  );
};

export default FooterSection;
