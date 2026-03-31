import * as React from 'react';

interface AdminLoadingStateProps {
  label: string;
}

const AdminLoadingState: React.FC<AdminLoadingStateProps> = ({ label }) => (
  <div role="status" aria-live="polite" className="rounded-3xl border border-zinc-800 bg-zinc-900 px-5 py-6 md:px-6">
    <div className="flex items-center gap-3">
      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-amber-400" aria-hidden />
      <p className="text-sm font-medium text-zinc-200">{label}</p>
    </div>
    <span className="sr-only">{label}</span>
    <div className="mt-4 space-y-2" aria-hidden>
      <div className="h-3 w-5/6 animate-pulse rounded bg-zinc-800" />
      <div className="h-3 w-2/3 animate-pulse rounded bg-zinc-800" />
      <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-800" />
    </div>
  </div>
);

export default AdminLoadingState;
