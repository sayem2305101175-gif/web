import * as React from 'react';
import { Outlet } from 'react-router-dom';

const DevSystemGuardian = import.meta.env.DEV && import.meta.env.VITE_ENABLE_SYSTEM_GUARDIAN === 'true'
  ? React.lazy(() => import('../../../components/SystemGuardian'))
  : null;

const Layout: React.FC = () => (
  <div className="min-h-screen bg-transparent text-zinc-950 selection:bg-zinc-950 selection:text-white">
    {DevSystemGuardian ? (
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
