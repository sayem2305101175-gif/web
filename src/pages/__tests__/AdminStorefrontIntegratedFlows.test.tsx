import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AdminOrdersPage from '../../features/admin/pages/AdminOrdersPage';
import { CartProvider } from '../../features/cart/context/CartContext';
import { orderService } from '../../features/cart/services/orderService';
import { WishlistProvider } from '../../features/wishlist/context/WishlistContext';
import type { AdminProductEditorDraft } from '../../features/admin/shared/types';
import { adminCatalogEditorService, adminCatalogService, adminContentService, adminOrderService } from '../../features/admin/shared/services';
import { shoeService } from '../../features/catalog/services/shoeService';
import { SHOES } from '../../constants';
import type { OrderSnapshot } from '../../types';
import CollectionPage from '../CollectionPage';
import Home from '../Home';
import ProductDetailPage from '../ProductDetailPage';

vi.mock('../../services/apiClient', () => ({
  isBackendConfigured: false,
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    status = 500;
    responseBody = null;
  },
}));

const SHARED_STORE_KEY = 'velosnak_admin_storefront_shared_v1';
const STOREFRONT_CONTENT_KEY = 'velosnak_storefront_content_v1';
const primaryShoe = SHOES[0];

if (!primaryShoe) {
  throw new Error('Expected primary shoe fixture to exist.');
}

const buildDraft = (id: string, overrides: Partial<AdminProductEditorDraft> = {}): AdminProductEditorDraft => ({
  id,
  name: 'Integration Relay One',
  brand: 'Signal Lab',
  category: 'Performance',
  colorway: 'Black / Volt',
  price: 229,
  compareAtPrice: 269,
  stockStatus: 'In stock',
  quantityOnHand: 22,
  sizes: ['US 8', 'US 9', 'US 10'],
  materials: ['Prime knit upper', 'Foam carrier'],
  shortBlurb: 'Integration-ready performance runner.',
  description:
    'A balanced performance shoe tuned for repeatable pace sessions and durable day-to-day route comfort.',
  image: 'https://example.com/integration-relay.jpg',
  modelUrl: 'https://example.com/integration-relay.glb',
  publishState: 'Draft',
  ...overrides,
});

const renderProductDetailRoute = (productId: string) =>
  render(
    <CartProvider>
      <WishlistProvider>
        <MemoryRouter initialEntries={[`/product/${encodeURIComponent(productId)}`]}>
          <Routes>
            <Route path="/product/:productId" element={<ProductDetailPage />} />
          </Routes>
        </MemoryRouter>
      </WishlistProvider>
    </CartProvider>
  );

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

const renderAdminOrders = (initialEntry = '/admin/orders') =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/admin/orders" element={<AdminOrdersPage />} />
        <Route path="/admin/orders/:orderId" element={<AdminOrdersPage />} />
      </Routes>
    </MemoryRouter>
  );

const renderCollectionRoute = () =>
  render(
    <CartProvider>
      <WishlistProvider>
        <MemoryRouter initialEntries={['/collection']}>
          <Routes>
            <Route path="/collection" element={<CollectionPage />} />
          </Routes>
        </MemoryRouter>
      </WishlistProvider>
    </CartProvider>
  );

const flushCatalogReactivity = () => new Promise<void>((resolve) => window.setTimeout(resolve, 260));

const buildCheckoutOrderSnapshot = (): OrderSnapshot => ({
  id: 'WS-2001',
  createdAt: '2026-03-25T11:15:00.000Z',
  items: [
    {
      ...primaryShoe,
      lineId: `${primaryShoe.id}-us-9`,
      quantity: 1,
      selectedSize: primaryShoe.sizes[0] ?? 'US 9',
    },
  ],
  subtotal: primaryShoe.price,
  shipping: 18,
  total: primaryShoe.price + 18,
  contact: {
    name: 'Integration Shopper',
    email: 'integration.shopper@example.com',
    city: 'Dhaka',
    country: 'Bangladesh',
    delivery: 'Express',
    notes: 'Please confirm the admin queue receives this order.',
  },
});

describe('admin-to-storefront integrated truth flows', () => {
  beforeEach(() => {
    window.localStorage.removeItem(SHARED_STORE_KEY);
    window.localStorage.removeItem(STOREFRONT_CONTENT_KEY);
  });

  afterEach(() => {
    window.localStorage.removeItem(SHARED_STORE_KEY);
    window.localStorage.removeItem(STOREFRONT_CONTENT_KEY);
    vi.clearAllMocks();
  });

  it('persists create-product state into admin catalog list', async () => {
    const draftId = adminCatalogEditorService.createEmptyDraft().id;
    const draft = buildDraft(draftId);
    await adminCatalogEditorService.saveDraft(draft);

    const rows = await adminCatalogService.listProducts({ search: draftId });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: draftId,
      name: draft.name,
      publishState: 'Draft',
    });
  });

  it('reflects publish and unpublish transitions in storefront visibility', async () => {
    const draftId = adminCatalogEditorService.createEmptyDraft().id;
    const draft = buildDraft(draftId);
    await adminCatalogEditorService.saveDraft(draft);

    expect(await shoeService.getShoeById(draftId)).toBeUndefined();

    await act(async () => {
      await adminCatalogEditorService.publishDraft(draft);
    });
    expect(await shoeService.getShoeById(draftId)).toBeDefined();
    expect((await shoeService.getAllShoes()).some((shoe) => shoe.id === draftId)).toBe(true);

    await adminCatalogEditorService.unpublishDraft({ ...draft, publishState: 'Published' });
    expect(await shoeService.getShoeById(draftId)).toBeUndefined();
    expect((await shoeService.getAllShoes()).some((shoe) => shoe.id === draftId)).toBe(false);
  });

  it('shows edited product fields on storefront product detail surface', async () => {
    const draftId = adminCatalogEditorService.createEmptyDraft().id;
    const draft = buildDraft(draftId);
    await adminCatalogEditorService.saveDraft(draft);
    await act(async () => {
      await adminCatalogEditorService.publishDraft(draft);
    });

    const editedDescription =
      'Edited integration description: this storefront detail should always mirror the latest persisted admin product content.';
    const editedName = 'Integration Relay Prime';
    const editedColorway = 'Solar / Ice';

    await adminCatalogEditorService.saveDraft({
      ...draft,
      name: editedName,
      description: editedDescription,
      colorway: editedColorway,
      publishState: 'Published',
    });

    renderProductDetailRoute(draftId);
    const headings = await screen.findAllByRole('heading', { name: editedName });
    expect(headings.length).toBeGreaterThan(0);
    expect(screen.getByText(editedDescription)).toBeInTheDocument();
    expect(screen.getByText(editedColorway)).toBeInTheDocument();
  });

  it('uses featured-drop selection from real catalog data on home surface', async () => {
    const draftId = adminCatalogEditorService.createEmptyDraft().id;
    const draft = buildDraft(draftId, { name: 'Integration Home Feature' });
    await adminCatalogEditorService.saveDraft(draft);
    await adminCatalogEditorService.publishDraft(draft);

    const content = await adminContentService.getStorefrontContent();
    await adminContentService.saveStorefrontContent({
      ...content,
      featuredDrop: {
        ...content.featuredDrop,
        productId: draftId,
        fallbackName: 'Fallback feature',
        fallbackBody: 'Should not render while featured product is published.',
        actionLabel: 'Open feature',
      },
    });

    renderHome();
    await screen.findByText('Integration Home Feature');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Open feature' })).not.toBeDisabled();
    });
  });

  it('falls back to configured featured copy when the selected home feature is no longer published', async () => {
    const draftId = adminCatalogEditorService.createEmptyDraft().id;
    const draft = buildDraft(draftId, { name: 'Integration Home Fallback' });
    await adminCatalogEditorService.saveDraft(draft);
    await adminCatalogEditorService.publishDraft(draft);

    const content = await adminContentService.getStorefrontContent();
    await adminContentService.saveStorefrontContent({
      ...content,
      featuredDrop: {
        ...content.featuredDrop,
        productId: draftId,
        fallbackName: 'Integration Fallback Feature',
        fallbackBody: 'This feature returns after the selected product is republished.',
        actionLabel: 'Open feature',
      },
    });

    await act(async () => {
      renderHome();
      await flushCatalogReactivity();
    });
    const initialFeatureNames = await screen.findAllByText('Integration Home Fallback');
    expect(initialFeatureNames.length).toBeGreaterThan(0);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Open feature' })).not.toBeDisabled();
    });

    await act(async () => {
      await adminCatalogEditorService.unpublishProduct(draftId);
      await flushCatalogReactivity();
    });

    await screen.findByText('Integration Fallback Feature');
    expect(screen.getByText('This feature returns after the selected product is republished.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open feature' })).toBeDisabled();
  });

  it('updates home collection in the same tab when a draft is published', async () => {
    const draftId = adminCatalogEditorService.createEmptyDraft().id;
    const draft = buildDraft(draftId, { name: 'Same Tab Publish One' });
    await adminCatalogEditorService.saveDraft(draft);

    await act(async () => {
      renderHome();
      await flushCatalogReactivity();
    });
    expect(screen.queryByText('Same Tab Publish One')).not.toBeInTheDocument();

    await act(async () => {
      await adminCatalogEditorService.publishDraft(draft);
      await flushCatalogReactivity();
    });

    const updatedNames = await screen.findAllByText('Same Tab Publish One');
    expect(updatedNames.length).toBeGreaterThan(0);
  });

  it('keeps the collection route aligned after publish, duplicate, and archive mutations', async () => {
    const draftId = adminCatalogEditorService.createEmptyDraft().id;
    const draft = buildDraft(draftId, {
      name: 'Collection Relay Alpha',
      brand: 'Reactive Brand',
    });
    await adminCatalogEditorService.saveDraft(draft);

    renderCollectionRoute();

    await screen.findByPlaceholderText(/search by name, brand, category, or colorway/i);
    expect(screen.queryByRole('button', { name: 'Reactive Brand' })).not.toBeInTheDocument();
    expect(screen.queryByText('Collection Relay Alpha')).not.toBeInTheDocument();

    await act(async () => {
      await adminCatalogEditorService.publishDraft(draft);
      await flushCatalogReactivity();
    });

    expect(await screen.findByRole('button', { name: 'Reactive Brand' })).toBeInTheDocument();
    expect(await screen.findAllByText('Collection Relay Alpha')).not.toHaveLength(0);

    const duplicated = await adminCatalogEditorService.duplicateProduct(draftId);
    expect(duplicated).not.toBeNull();

    await act(async () => {
      await flushCatalogReactivity();
    });

    expect(screen.queryByText('Collection Relay Alpha Copy')).not.toBeInTheDocument();

    await act(async () => {
      await adminCatalogEditorService.archiveProduct(draftId);
      await flushCatalogReactivity();
    });

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Reactive Brand' })).not.toBeInTheDocument();
      expect(screen.queryByText('Collection Relay Alpha')).not.toBeInTheDocument();
    });
  });

  it('keeps the product detail route aligned after edit and unpublish mutations', async () => {
    const draftId = adminCatalogEditorService.createEmptyDraft().id;
    const draft = buildDraft(draftId, {
      name: 'Reactive Detail One',
      colorway: 'Signal / Ink',
    });
    await adminCatalogEditorService.saveDraft(draft);
    await adminCatalogEditorService.publishDraft(draft);

    renderProductDetailRoute(draftId);

    const initialHeadings = await screen.findAllByRole('heading', { name: 'Reactive Detail One' });
    expect(initialHeadings.length).toBeGreaterThan(0);

    await act(async () => {
      await adminCatalogEditorService.saveDraft({
        ...draft,
        name: 'Reactive Detail Prime',
        colorway: 'Solar / Ice',
        description: 'Reactive product detail should refresh in the same tab without a route reload.',
        publishState: 'Published',
      });
      await flushCatalogReactivity();
    });

    const updatedHeadings = await screen.findAllByRole('heading', { name: 'Reactive Detail Prime' });
    expect(updatedHeadings.length).toBeGreaterThan(0);
    expect(
      screen.getByText('Reactive product detail should refresh in the same tab without a route reload.')
    ).toBeInTheDocument();
    expect(screen.getByText('Solar / Ice')).toBeInTheDocument();

    await act(async () => {
      await adminCatalogEditorService.unpublishProduct(draftId);
      await flushCatalogReactivity();
    });

    expect(await screen.findByText(/this product could not be found\./i)).toBeInTheDocument();
  });

  it('reflects shopper checkout orders in admin and persists status updates', async () => {
    renderAdminOrders();
    await screen.findByRole('button', { name: /ws-1048/i });

    let createdOrder: OrderSnapshot | null = null;
    await act(async () => {
      createdOrder = await orderService.createOrder(buildCheckoutOrderSnapshot());
    });
    if (!createdOrder) {
      throw new Error('Expected shopper checkout order to be created.');
    }
    const submittedOrder: OrderSnapshot = createdOrder;

    const orderRow = await screen.findByRole('button', { name: new RegExp(submittedOrder.id, 'i') });
    expect(orderRow).toBeInTheDocument();

    fireEvent.click(orderRow);

    await screen.findByText(/order detail/i);
    expect(screen.getAllByText('Integration Shopper').length).toBeGreaterThan(0);
    expect(screen.getAllByText('integration.shopper@example.com').length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText(/update status/i), { target: { value: 'Shipped' } });
    fireEvent.click(screen.getByRole('button', { name: /review change/i }));

    await screen.findByRole('dialog');
    fireEvent.click(screen.getByRole('button', { name: /apply status/i }));

    expect(await screen.findByText(/order status updated to shipped/i)).toBeInTheDocument();

    await waitFor(async () => {
      const persistedDetail = await adminOrderService.getOrderDetail(submittedOrder.id);
      expect(persistedDetail?.status).toBe('Shipped');
    });
  });
});
