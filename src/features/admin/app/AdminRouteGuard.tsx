import * as React from 'react';
import { Link } from 'react-router-dom';

const isAdminEnabled = () => {
  if (import.meta.env.VITE_ADMIN_ENABLED === 'true') {
    return true;
  }

  if (import.meta.env.VITE_ADMIN_ENABLED === 'false') {
    return false;
  }

  return import.meta.env.DEV;
};

const AdminAccessStub: React.FC = () => (
  <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-zinc-100">
    <div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-900/70 p-8 backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-400">Admin access</p>
      <h1 className="mt-3 text-2xl font-black tracking-tight text-white">Owner panel is currently disabled.</h1>
      <p className="mt-3 text-sm leading-relaxed text-zinc-300">
        Set <code className="rounded bg-zinc-800 px-1 py-0.5 text-zinc-100">VITE_ADMIN_ENABLED=true</code> to use
        admin routes in this environment.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex rounded-full border border-zinc-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-100 transition hover:border-zinc-400"
      >
        Back to storefront
      </Link>
    </div>
  </div>
);

interface AdminRouteGuardProps {
  children: React.ReactElement;
}

const AdminRouteGuard: React.FC<AdminRouteGuardProps> = ({ children }) =>
  isAdminEnabled() ? children : <AdminAccessStub />;

export default AdminRouteGuard;
