import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { getDefaultStorefrontContentSnapshot } from '../../content/storefront';
import { CartProvider } from '../../context/CartContext';
import { WishlistProvider } from '../../context/WishlistContext';
import CartDrawer from '../../components/CartDrawer';
import { CART_STORAGE_KEY, RECENT_ORDER_STORAGE_KEY } from '../../lib/storage';
import type { OrderSnapshot } from '../../types';
import {
  adminCatalogEditorService,
  adminCatalogService,
  adminContentService,
  adminOrderService,
} from '../../features/admin/shared/services';
import type { AdminProductEditorDraft, SharedOrderRecord, SharedProductRecord } from '../../features/admin/shared/types';
import { shoeService } from '../../features/catalog/services/shoeService';
import Home from '../Home';

const backendTransport = vi.hoisted(() => {
  class MockApiError extends Error {
    status: number;
    responseBody: unknown;

    constructor(message: string, status: number, responseBody: unknown) {
      super(message);
      this.status = status;
      this.responseBody = responseBody;
    }
  }

  return {
    MockApiError,
    get: vi.fn(),
    post: vi.fn(),
    state: {
      products: [] as SharedProductRecord[],
      content: null as ReturnType<typeof getDefaultStorefrontContentSnapshot> | null,
      orders: [] as SharedOrderRecord[],
      duplicateCounter: 1,
    },
  };
});

vi.mock('../../services/apiClient', () => ({
  isBackendConfigured: true,
  apiClient: {
    get: backendTransport.get,
    post: backendTransport.post,
  },
  ApiError: backendTransport.MockApiError,
}));

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const buildDraft = (id: string, overrides: Partial<AdminProductEditorDraft> = {}): AdminProductEditorDraft => ({
  id,
  name: 'Backend Relay One',
  brand: 'Signal Lab',
  category: 'Performance',
  colorway: 'Black / Volt',
  price: 229,
  compareAtPrice: 269,
  stockStatus: 'In stock',
  quantityOnHand: 22,
  sizes: ['US 8', 'US 9', 'US 10'],
  materials: ['Prime knit upper', 'Foam carrier'],
  shortBlurb: 'Backend integration-ready performance runner.',
  description:
    'A balanced performance shoe tuned for repeatable pace sessions and durable day-to-day route comfort.',
  image: 'https://example.com/backend-relay.jpg',
  modelUrl: 'https://example.com/backend-relay.glb',
  publishState: 'Draft',
  ...overrides,
});

const buildProductRecord = (id: string, overrides: Partial<SharedProductRecord> = {}): SharedProductRecord => ({
  id,
  name: 'Backend Seed Runner',
  brand: 'Signal Lab',
  category: 'Performance',
  colorway: 'Stone / White',
  price: 240,
  compareAtPrice: 280,
  stockStatus: 'In stock',
  quantityOnHand: 16,
  sizes: ['US 8', 'US 9', 'US 10'],
  materials: ['Mesh upper', 'Foam carrier'],
  shortBlurb: 'Seeded backend catalog product.',
  description: 'Seeded backend product used to prove backend-mode integration flows.',
  image: 'https://example.com/backend-seed.jpg',
  modelUrl: 'https://example.com/backend-seed.glb',
  shippingNote: 'Ships in 24 hours.',
  featuredNote: 'Featured backend seed.',
  accentColor: '#111827',
  hypeScore: 85,
  isNew: true,
  publishState: 'Published',
  updatedAt: '2026-03-25T12:00:00.000Z',
  ...overrides,
});

const buildOrderRecord = (id: string, overrides: Partial<SharedOrderRecord> = {}): SharedOrderRecord => ({
  id,
  createdAt: '2026-03-25T10:00:00.000Z',
  status: 'Pending',
  itemCount: 1,
  subtotal: 220,
  shippingFee: 18,
  total: 238,
  updatedAt: null,
  contact: {
    name: 'Taylor Reed',
    email: 'taylor@example.com',
    phone: '',
    city: 'Boston',
    country: 'USA',
    shippingAddress: '',
    deliveryMethod: 'Standard',
    notes: '',
  },
  lineItems: [
    {
      id: `${id}-line-1`,
      productId: 'seed-backend-1',
      productName: 'Backend Seed Runner',
      size: 'US 9',
      quantity: 1,
      unitPrice: 220,
      lineTotal: 220,
    },
  ],
  ...overrides,
});

const toOrderRecord = (snapshot: OrderSnapshot): SharedOrderRecord => ({
  id: snapshot.id,
  createdAt: snapshot.createdAt,
  status: 'Pending',
  itemCount: snapshot.items.reduce((total, item) => total + item.quantity, 0),
  subtotal: snapshot.subtotal,
  shippingFee: snapshot.shipping,
  total: snapshot.total,
  updatedAt: null,
  contact: {
    name: snapshot.contact.name,
    email: snapshot.contact.email,
    phone: '',
    city: snapshot.contact.city,
    country: snapshot.contact.country,
    shippingAddress: '',
    deliveryMethod: snapshot.contact.delivery,
    notes: snapshot.contact.notes,
  },
  lineItems: snapshot.items.map((item) => ({
    id: item.lineId,
    productId: item.id,
    productName: item.name,
    size: item.selectedSize,
    quantity: item.quantity,
    unitPrice: item.price,
    lineTotal: item.price * item.quantity,
  })),
});

const findProductOrThrow = (productId: string) => {
  const product = backendTransport.state.products.find((entry) => entry.id === productId);
  if (!product) {
    throw new backendTransport.MockApiError('Product not found.', 404, null);
  }
  return product;
};

const findOrderOrThrow = (orderId: string) => {
  const order = backendTransport.state.orders.find((entry) => entry.id === orderId);
  if (!order) {
    throw new backendTransport.MockApiError('Order not found.', 404, null);
  }
  return order;
};

const createTimestamp = () => new Date().toISOString();

const renderHome = () =>
  render(
    <CartProvider>
      <WishlistProvider>
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      </WishlistProvider>
    </CartProvider>
  );

const renderCartDrawer = () =>
  render(
    <CartProvider>
      <CartDrawer isOpen onClose={() => undefined} />
    </CartProvider>
  );

describe('backend-mode integrated truth flows', () => {
  beforeEach(() => {
    window.localStorage.clear();
    backendTransport.state.products = [
      buildProductRecord('seed-backend-1', { name: 'Seed Backend Runner' }),
      buildProductRecord('seed-backend-2', { name: 'Seed Backend Trainer', brand: 'North Signal', isNew: false }),
    ];
    backendTransport.state.content = getDefaultStorefrontContentSnapshot();
    backendTransport.state.orders = [buildOrderRecord('WS-2001')];
    backendTransport.state.duplicateCounter = 1;

    backendTransport.get.mockReset();
    backendTransport.post.mockReset();

    backendTransport.get.mockImplementation(async (path: string, query?: Record<string, unknown>) => {
      if (path === '/api/admin/shoes') {
        return clone(backendTransport.state.products);
      }

      if (path.startsWith('/api/admin/shoes/')) {
        return clone(findProductOrThrow(decodeURIComponent(path.replace('/api/admin/shoes/', ''))));
      }

      if (path === '/api/shoes') {
        let products = backendTransport.state.products.filter((product) => product.publishState === 'Published');
        if (typeof query?.['brand'] === 'string' && query['brand'] !== 'All') {
          products = products.filter((product) => product.brand === query['brand']);
        }
        if (query?.['newArrivals'] === true) {
          products = products.filter((product) => product.isNew);
        }
        return clone(products);
      }

      if (path.startsWith('/api/shoes/')) {
        const product = findProductOrThrow(decodeURIComponent(path.replace('/api/shoes/', '')));
        if (product.publishState !== 'Published') {
          throw new backendTransport.MockApiError('Product not found.', 404, null);
        }
        return clone(product);
      }

      if (path === '/api/storefront-content') {
        return clone(backendTransport.state.content);
      }

      if (path === '/api/admin/orders') {
        return clone(backendTransport.state.orders);
      }

      if (path.startsWith('/api/admin/orders/')) {
        return clone(findOrderOrThrow(decodeURIComponent(path.replace('/api/admin/orders/', ''))));
      }

      throw new Error(`Unhandled GET path in backend-mode integration test: ${path}`);
    });

    backendTransport.post.mockImplementation(async (path: string, body: unknown) => {
      if (path === '/api/admin/shoes') {
        const savedProduct = {
          ...(body as SharedProductRecord),
          updatedAt: createTimestamp(),
        };
        backendTransport.state.products = [
          ...backendTransport.state.products.filter((product) => product.id !== savedProduct.id),
          savedProduct,
        ];
        return clone(savedProduct);
      }

      if (/^\/api\/admin\/shoes\/[^/]+$/.test(path)) {
        const productId = decodeURIComponent(path.replace('/api/admin/shoes/', ''));
        findProductOrThrow(productId);
        const savedProduct = {
          ...(body as SharedProductRecord),
          id: productId,
          updatedAt: createTimestamp(),
        };
        backendTransport.state.products = backendTransport.state.products.map((product) =>
          product.id === productId ? savedProduct : product
        );
        return clone(savedProduct);
      }

      if (/^\/api\/admin\/shoes\/[^/]+\/duplicate$/.test(path)) {
        const productId = decodeURIComponent(path.replace('/api/admin/shoes/', '').replace('/duplicate', ''));
        const source = findProductOrThrow(productId);
        const duplicatedProduct: SharedProductRecord = {
          ...source,
          id: `${source.id}-copy-${backendTransport.state.duplicateCounter++}`,
          name: `${source.name} Copy`,
          publishState: 'Draft',
          updatedAt: createTimestamp(),
        };
        backendTransport.state.products = [...backendTransport.state.products, duplicatedProduct];
        return clone(duplicatedProduct);
      }

      if (/^\/api\/admin\/shoes\/[^/]+\/publish-state$/.test(path)) {
        const productId = decodeURIComponent(path.replace('/api/admin/shoes/', '').replace('/publish-state', ''));
        const source = findProductOrThrow(productId);
        const publishState = (body as { publishState: SharedProductRecord['publishState'] }).publishState;
        const updatedProduct = {
          ...source,
          publishState,
          updatedAt: createTimestamp(),
        };
        backendTransport.state.products = backendTransport.state.products.map((product) =>
          product.id === productId ? updatedProduct : product
        );
        return clone(updatedProduct);
      }

      if (path === '/api/admin/storefront-content') {
        const nextContent = {
          ...clone(body as ReturnType<typeof getDefaultStorefrontContentSnapshot>),
          updatedAt: createTimestamp(),
        };
        backendTransport.state.content = nextContent;
        return clone(nextContent);
      }

      if (path === '/api/orders') {
        const snapshot = clone(body as OrderSnapshot);
        backendTransport.state.orders = [toOrderRecord(snapshot), ...backendTransport.state.orders];
        return clone(snapshot);
      }

      if (/^\/api\/admin\/orders\/[^/]+\/status$/.test(path)) {
        const orderId = decodeURIComponent(path.replace('/api/admin/orders/', '').replace('/status', ''));
        const source = findOrderOrThrow(orderId);
        const updatedOrder = {
          ...source,
          status: (body as { status: SharedOrderRecord['status'] }).status,
          updatedAt: createTimestamp(),
        };
        backendTransport.state.orders = backendTransport.state.orders.map((order) =>
          order.id === orderId ? updatedOrder : order
        );
        return clone(updatedOrder);
      }

      throw new Error(`Unhandled POST path in backend-mode integration test: ${path}`);
    });
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it('keeps create/edit/publish/unpublish aligned across admin and storefront in backend mode', async () => {
    const draftId = adminCatalogEditorService.createEmptyDraft().id;
    const draft = buildDraft(draftId);
    await adminCatalogEditorService.saveDraft(draft);

    const adminDraftRows = await adminCatalogService.listProducts({ search: draftId });
    expect(adminDraftRows).toHaveLength(1);
    expect(adminDraftRows[0]?.publishState).toBe('Draft');
    expect(await shoeService.getShoeById(draftId)).toBeUndefined();

    await adminCatalogEditorService.publishDraft(draft);
    const publishedProduct = await shoeService.getShoeById(draftId);
    expect(publishedProduct?.name).toBe(draft.name);

    const editedName = 'Backend Relay Prime';
    await adminCatalogEditorService.saveDraft({
      ...draft,
      name: editedName,
      publishState: 'Published',
    });

    const editedDetail = await shoeService.getShoeById(draftId);
    expect(editedDetail?.name).toBe(editedName);

    await adminCatalogEditorService.unpublishDraft({
      ...draft,
      name: editedName,
      publishState: 'Published',
    });

    expect(await shoeService.getShoeById(draftId)).toBeUndefined();
    const finalAdminRows = await adminCatalogService.listProducts({ search: draftId });
    expect(finalAdminRows[0]?.publishState).toBe('Draft');
  });

  it('renders backend-updated content and featured merchandising on the storefront home surface', async () => {
    const draftId = adminCatalogEditorService.createEmptyDraft().id;
    const draft = buildDraft(draftId, {
      name: 'Backend Feature Runner',
      publishState: 'Published',
    });
    await adminCatalogEditorService.saveDraft(draft);
    await adminCatalogEditorService.publishDraft(draft);

    const currentContent = await adminContentService.getStorefrontContent();
    await adminContentService.saveStorefrontContent({
      ...currentContent,
      hero: {
        ...currentContent.hero,
        headline: 'Backend-managed hero headline',
      },
      featuredDrop: {
        ...currentContent.featuredDrop,
        productId: draftId,
        actionLabel: 'Open backend feature',
      },
    });

    const featuredProduct = await shoeService.getFeaturedMerchandisingShoeById(draftId);
    expect(featuredProduct?.name).toBe('Backend Feature Runner');

    renderHome();

    await screen.findByText('Backend-managed hero headline');
    const matchingFeatureNames = await screen.findAllByText('Backend Feature Runner');
    expect(matchingFeatureNames.length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Open backend feature' })).toBeInTheDocument();
  });

  it('shares backend order submission with admin order management', async () => {
    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify([
        {
          id: 'seed-backend-1',
          lineId: 'seed-backend-1-us-9',
          name: 'Seed Backend Runner',
          brand: 'Signal Lab',
          category: 'Performance',
          price: 240,
          compareAtPrice: 280,
          image: 'https://example.com/backend-seed.jpg',
          description: 'Seeded backend product used to prove backend-mode integration flows.',
          shortBlurb: 'Seeded backend catalog product.',
          colorway: 'Stone / White',
          hypeScore: 85,
          accentColor: '#111827',
          modelUrl: 'https://example.com/backend-seed.glb',
          sizes: ['US 9', 'US 10'],
          materials: ['Mesh upper', 'Foam carrier'],
          stockStatus: 'In stock',
          shippingNote: 'Ships in 24 hours.',
          featuredNote: 'Featured backend seed.',
          quantity: 1,
          selectedSize: 'US 9',
        },
      ])
    );

    renderCartDrawer();

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'jane@example.com' } });
    fireEvent.change(screen.getByLabelText(/city/i), { target: { value: 'Dhaka' } });
    fireEvent.change(screen.getByLabelText(/country/i), { target: { value: 'Bangladesh' } });
    fireEvent.click(screen.getByRole('button', { name: /place order/i }));

    await screen.findByRole('heading', { name: /order confirmed/i });

    const recentOrder = JSON.parse(window.localStorage.getItem(RECENT_ORDER_STORAGE_KEY) ?? 'null') as OrderSnapshot | null;
    expect(recentOrder?.contact.name).toBe('Jane Doe');
    if (!recentOrder) {
      throw new Error('Expected recent order to be stored after backend checkout submission.');
    }

    const orders = await adminOrderService.listOrders();
    expect(orders.some((order) => order.id === recentOrder.id && order.status === 'Pending')).toBe(true);

    const updatedOrder = await adminOrderService.updateOrderStatus(recentOrder.id, 'Shipped');
    expect(updatedOrder?.status).toBe('Shipped');

    const reloadedDetail = await adminOrderService.getOrderDetail(recentOrder.id);
    expect(reloadedDetail?.status).toBe('Shipped');
  });
});
