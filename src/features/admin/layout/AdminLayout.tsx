import * as React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { ADMIN_NAV_ITEMS, type AdminNavItem } from '../app/adminRoutes';
import { confirmAdminNavigation } from '../shared/utils';

const resolveNavClassName = ({ isActive }: { isActive: boolean }) =>
  `block rounded-2xl border px-4 py-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 ${
    isActive
      ? 'border-zinc-700 bg-zinc-800 text-zinc-100 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]'
      : 'border-transparent text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-100'
  }`;

const NAV_SECTION_ORDER: AdminNavItem['section'][] = ['Core', 'Commerce', 'Storefront', 'Platform'];

const groupedNavigation = ADMIN_NAV_ITEMS.reduce<Record<AdminNavItem['section'], AdminNavItem[]>>(
  (acc, item) => {
    acc[item.section].push(item);
    return acc;
  },
  {
    Core: [],
    Commerce: [],
    Storefront: [],
    Platform: [],
  }
);

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const mainRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    mainRef.current?.focus();
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 [background-image:radial-gradient(circle_at_20%_5%,rgba(161,98,7,0.14),transparent_40%),radial-gradient(circle_at_80%_15%,rgba(14,116,144,0.12),transparent_35%)]">
      <div className="mx-auto grid min-h-screen w-full max-w-[1440px] gap-4 px-4 py-5 md:gap-6 md:px-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-4 backdrop-blur md:p-5 lg:sticky lg:top-5 lg:max-h-[calc(100vh-2.5rem)] lg:overflow-y-auto">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-zinc-500">Webshoe operations</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-white">Owner panel</h1>
        <p className="mt-3 text-sm text-zinc-400">Route-isolated workspace for catalog, order, and storefront control.</p>

        <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Session</p>
          <p className="mt-2 text-xs text-zinc-300">
            {import.meta.env.DEV ? 'Development workspace' : 'Production workspace'}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Last checked {new Date().toLocaleTimeString()}</p>
        </div>

        <nav className="mt-6 space-y-4" aria-label="Admin sections">
          {NAV_SECTION_ORDER.map((section) => (
            <div key={section}>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500">{section}</p>
              <div className="space-y-2">
                {groupedNavigation[section].map((item) => (
                  <NavLink
                    key={item.id}
                    to={item.to}
                    className={resolveNavClassName}
                    onClick={(event) => {
                      if (!confirmAdminNavigation()) {
                        event.preventDefault();
                      }
                    }}
                  >
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="mt-1 text-xs text-zinc-400">{item.description}</p>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        </aside>

        <main
          ref={mainRef}
          tabIndex={-1}
          className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-4 backdrop-blur focus:outline-none md:p-6"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
