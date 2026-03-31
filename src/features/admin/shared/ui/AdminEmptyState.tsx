import * as React from 'react';

interface AdminEmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'neutral' | 'error' | 'warning' | 'success';
}

const resolveToneClassName = (tone: NonNullable<AdminEmptyStateProps['tone']>) => {
  if (tone === 'error') {
    return 'border-rose-500/40 bg-rose-500/10 text-rose-100';
  }
  if (tone === 'warning') {
    return 'border-amber-500/40 bg-amber-500/10 text-amber-100';
  }
  if (tone === 'success') {
    return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100';
  }

  return 'border-zinc-700 bg-zinc-900/40 text-zinc-100';
};

const AdminEmptyState: React.FC<AdminEmptyStateProps> = ({
  actionLabel,
  description,
  onAction,
  title,
  tone = 'neutral',
}) => (
  <article
    role={tone === 'error' ? 'alert' : 'status'}
    aria-live="polite"
    className={`rounded-3xl border border-dashed px-5 py-7 md:px-6 ${resolveToneClassName(tone)}`}
  >
    <p className="text-sm font-semibold">{title}</p>
    <p className="mt-2 text-sm leading-relaxed text-zinc-300">{description}</p>
    {actionLabel && onAction ? (
      <button
        type="button"
        onClick={onAction}
        className="mt-5 rounded-full border border-zinc-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-100 transition hover:border-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300/70"
      >
        {actionLabel}
      </button>
    ) : null}
  </article>
);

export default AdminEmptyState;
