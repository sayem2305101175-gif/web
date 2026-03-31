import * as React from 'react';

interface AdminPageFrameProps {
  eyebrow: string;
  title: string;
  summary: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

const AdminPageFrame: React.FC<AdminPageFrameProps> = ({ actions, children, eyebrow, summary, title }) => (
  <section className="space-y-4 md:space-y-6">
    <header className="rounded-3xl border border-zinc-800 bg-zinc-900/80 px-4 py-5 md:px-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-100 md:text-3xl">{title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-300">{summary}</p>
        </div>
        {actions ? <div className="shrink-0 md:self-start">{actions}</div> : null}
      </div>
    </header>
    {children}
  </section>
);

export default AdminPageFrame;
