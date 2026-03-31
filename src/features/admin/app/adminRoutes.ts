export const ADMIN_ROUTE_PATHS = {
  root: '/admin',
  dashboard: '/admin/dashboard',
  catalog: '/admin/catalog',
  catalogCreate: '/admin/catalog/new',
  orders: '/admin/orders',
  orderDetailTemplate: '/admin/orders/:orderId',
  content: '/admin/content',
  assets: '/admin/assets',
  settings: '/admin/settings',
} as const;

export interface AdminNavItem {
  id: string;
  label: string;
  to: string;
  description: string;
  section: 'Core' | 'Commerce' | 'Storefront' | 'Platform';
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    to: ADMIN_ROUTE_PATHS.dashboard,
    description: 'Owner command center',
    section: 'Core',
  },
  {
    id: 'catalog',
    label: 'Catalog',
    to: ADMIN_ROUTE_PATHS.catalog,
    description: 'Product lineup and lifecycle',
    section: 'Commerce',
  },
  {
    id: 'catalog-editor',
    label: 'Catalog Editor',
    to: ADMIN_ROUTE_PATHS.catalogCreate,
    description: 'Create and stage product entries',
    section: 'Commerce',
  },
  {
    id: 'orders',
    label: 'Orders',
    to: ADMIN_ROUTE_PATHS.orders,
    description: 'Fulfillment and delivery queue',
    section: 'Commerce',
  },
  {
    id: 'content',
    label: 'Content',
    to: ADMIN_ROUTE_PATHS.content,
    description: 'Merchandising and storefront copy',
    section: 'Storefront',
  },
  {
    id: 'assets',
    label: 'Assets',
    to: ADMIN_ROUTE_PATHS.assets,
    description: 'Media and 3D readiness inventory',
    section: 'Storefront',
  },
  {
    id: 'settings',
    label: 'Settings',
    to: ADMIN_ROUTE_PATHS.settings,
    description: 'Team policy and channel controls',
    section: 'Platform',
  },
];

export const resolveCatalogEditorPath = (productId?: string) =>
  productId ? `/admin/catalog/${encodeURIComponent(productId)}/edit` : ADMIN_ROUTE_PATHS.catalogCreate;

export const resolveOrderDetailPath = (orderId: string) => `/admin/orders/${encodeURIComponent(orderId)}`;
