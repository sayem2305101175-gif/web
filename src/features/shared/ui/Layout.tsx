import * as React from 'react';
import { Outlet } from 'react-router-dom';

const DevSystemGuardian = import.meta.env.DEV && import.meta.env.VITE_ENABLE_SYSTEM_GUARDIAN === 'true'
  ? React.lazy(() => import('../../../components/SystemGuardian'))
  : null;

const Layout: React.FC = () => {
  const mainRef = React.useRef<HTMLElement | null>(null);

  const handleSkipToMain = React.useCallback((event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    mainRef.current?.focus();
  }, []);

  return (
    <div className="min-h-screen bg-transparent text-zinc-950 selection:bg-zinc-950 selection:text-white">
      {DevSystemGuardian ? (
        <React.Suspense fallback={null}>
          <DevSystemGuardian />
        </React.Suspense>
      ) : null}
      <a
        href="#main-content"
        onClick={handleSkipToMain}
        className="sr-only fixed left-4 top-4 z-50 rounded-full bg-zinc-950 px-4 py-3 text-xs font-black uppercase tracking-[0.22em] text-white focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-zinc-950/25"
      >
        Skip to main content
      </a>
      <main id="main-content" ref={mainRef} tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
