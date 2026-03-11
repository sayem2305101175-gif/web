import * as React from 'react';
import { Outlet } from 'react-router-dom';

const DevSystemGuardian = React.lazy(() => import('./SystemGuardian'));

const Layout: React.FC = () => (
  <div className="min-h-screen bg-transparent text-zinc-950 selection:bg-zinc-950 selection:text-white">
    {import.meta.env.DEV ? (
      <React.Suspense fallback={null}>
        <DevSystemGuardian />
      </React.Suspense>
    ) : null}
    <main>
      <Outlet />
    </main>
  </div>
);

export default Layout;
