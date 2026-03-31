import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CartProvider } from '../../features/cart/context/CartContext';
import { WishlistProvider } from '../../features/wishlist/context/WishlistContext';
import Home from '../Home';
import { adminCatalogEditorService, adminContentService } from '../../features/admin/shared/services';
import type { AdminProductEditorDraft } from '../../features/admin/shared/types';

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

const buildDraft = (id: string): AdminProductEditorDraft => ({
  id,
  name: 'Merch Pulse One',
  brand: 'Signal Lab',
  category: 'Performance',
  colorway: 'Onyx / Volt',
  price: 235,
  compareAtPrice: 280,
  stockStatus: 'In stock',
  quantityOnHand: 18,
  sizes: ['US 8', 'US 9', 'US 10'],
  materials: ['Prime knit upper', 'Stability plate'],
  shortBlurb: 'High-impact cushioning tuned for featured launches.',
  description:
    'A flagship performance silhouette with responsive cushioning, durable traction, and a refined profile built for spotlight merchandising.',
  image: 'https://example.com/merch-pulse-hero.jpg',
  modelUrl: 'https://example.com/merch-pulse.glb',
  publishState: 'Draft',
});

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

const flushHomeReactivity = () => new Promise<void>((resolve) => window.setTimeout(resolve, 260));

describe('Home featured merchandising', () => {
  beforeEach(() => {
    window.localStorage.removeItem(SHARED_STORE_KEY);
    window.localStorage.removeItem(STOREFRONT_CONTENT_KEY);
  });

  afterEach(() => {
    window.localStorage.removeItem(SHARED_STORE_KEY);
    window.localStorage.removeItem(STOREFRONT_CONTENT_KEY);
  });

  it('does not frame self-contained mode as a pre-backend limitation banner', async () => {
    await act(async () => {
      renderHome();
      await flushHomeReactivity();
    });

    expect(screen.queryByText(/self-contained studio build/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/before backend publishing is connected/i)).not.toBeInTheDocument();
  });

  it('resolves featured merchandising through shared catalog publish state across remounts', async () => {
    const draftId = adminCatalogEditorService.createEmptyDraft().id;
    const draft = buildDraft(draftId);
    await adminCatalogEditorService.saveDraft(draft);

    const content = await adminContentService.getStorefrontContent();
    await adminContentService.saveStorefrontContent({
      ...content,
      featuredDrop: {
        ...content.featuredDrop,
        productId: draftId,
        fallbackName: 'Fallback Spotlight',
        fallbackBody: 'Awaiting a published featured product.',
        actionLabel: 'View product',
      },
    });

    let firstRender: ReturnType<typeof renderHome>;
    await act(async () => {
      firstRender = renderHome();
      await flushHomeReactivity();
    });
    await screen.findByText('Fallback Spotlight');
    expect(screen.getByRole('button', { name: 'View product' })).toBeDisabled();
    firstRender!.unmount();

    await adminCatalogEditorService.publishDraft({ ...draft, publishState: 'Draft' });

    let secondRender: ReturnType<typeof renderHome>;
    await act(async () => {
      secondRender = renderHome();
      await flushHomeReactivity();
    });
    const headings = await screen.findAllByText('Merch Pulse One');
    expect(headings.length).toBeGreaterThan(0);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'View product' })).not.toBeDisabled();
    });
    secondRender!.unmount();

    await adminCatalogEditorService.unpublishDraft({ ...draft, publishState: 'Published' });

    await act(async () => {
      renderHome();
      await flushHomeReactivity();
    });
    await screen.findByText('Fallback Spotlight');
    expect(screen.getByRole('button', { name: 'View product' })).toBeDisabled();
  });

  it('updates hero content in the same tab after storefront content changes', async () => {
    await act(async () => {
      renderHome();
    });

    await act(async () => {
      await flushHomeReactivity();
    });

    const initialContent = await adminContentService.getStorefrontContent();
    await screen.findByRole('heading', { name: initialContent.hero.headline });

    await act(async () => {
      await adminContentService.saveStorefrontContent({
        ...initialContent,
        hero: {
          ...initialContent.hero,
          headline: 'Same-tab hero headline update',
        },
      });
    });

    await act(async () => {
      await flushHomeReactivity();
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Same-tab hero headline update' })).toBeInTheDocument();
    });
  });

  it('updates featured merchandising in the same tab when the published product changes', async () => {
    const draftId = adminCatalogEditorService.createEmptyDraft().id;
    const draft = buildDraft(draftId);
    await adminCatalogEditorService.saveDraft(draft);
    await adminCatalogEditorService.publishDraft(draft);

    const content = await adminContentService.getStorefrontContent();
    await adminContentService.saveStorefrontContent({
      ...content,
      featuredDrop: {
        ...content.featuredDrop,
        productId: draftId,
        actionLabel: 'View product',
      },
    });

    await act(async () => {
      renderHome();
      await flushHomeReactivity();
    });
    const initialNames = await screen.findAllByText('Merch Pulse One');
    expect(initialNames.length).toBeGreaterThan(0);

    await act(async () => {
      await adminCatalogEditorService.saveDraft({
        ...draft,
        publishState: 'Published',
        name: 'Merch Pulse Prime',
      });
      await flushHomeReactivity();
    });

    await waitFor(() => {
      const updatedNames = screen.getAllByText('Merch Pulse Prime');
      expect(updatedNames.length).toBeGreaterThan(0);
    });
  });

  it('falls back to configured featured copy in the same tab when the selected product is unpublished', async () => {
    const draftId = adminCatalogEditorService.createEmptyDraft().id;
    const draft = buildDraft(draftId);
    await adminCatalogEditorService.saveDraft(draft);
    await adminCatalogEditorService.publishDraft(draft);

    const content = await adminContentService.getStorefrontContent();
    await adminContentService.saveStorefrontContent({
      ...content,
      featuredDrop: {
        ...content.featuredDrop,
        productId: draftId,
        fallbackName: 'Fallback Spotlight',
        fallbackBody: 'Awaiting a published featured product.',
        actionLabel: 'View product',
      },
    });

    await act(async () => {
      renderHome();
      await flushHomeReactivity();
    });
    const liveNames = await screen.findAllByText('Merch Pulse One');
    expect(liveNames.length).toBeGreaterThan(0);

    await act(async () => {
      await adminCatalogEditorService.unpublishProduct(draftId);
      await flushHomeReactivity();
    });

    await screen.findByText('Fallback Spotlight');
    expect(screen.getByText('Awaiting a published featured product.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View product' })).toBeDisabled();
  });
});
