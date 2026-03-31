import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminContentPage from '../AdminContentPage';
import type { StorefrontContentSnapshot } from '../../../../content/storefront';
import type { AdminContentSection, AdminFeaturedProductOption } from '../../shared/types';

const mockedContentService = vi.hoisted(() => ({
  listSections: vi.fn(),
  getStorefrontContent: vi.fn(),
  saveStorefrontContent: vi.fn(),
  listFeaturedProducts: vi.fn(),
  subscribe: vi.fn(),
}));

vi.mock('../../shared/services', () => ({
  adminContentService: mockedContentService,
}));

const sections: AdminContentSection[] = [
  { id: 'hero', name: 'Hero Messaging', description: 'Hero controls', lastUpdatedAt: null },
  { id: 'featured-drop', name: 'Featured Drop', description: 'Featured controls', lastUpdatedAt: null },
];

const featuredProducts: AdminFeaturedProductOption[] = [
  { id: '1', name: 'Phantom Velocity X', brand: 'VeloSnak Elite', publishState: 'Published', stockStatus: 'In stock' },
  { id: '2', name: 'Aero-Core Prototype', brand: 'VeloSnak Elite', publishState: 'Draft', stockStatus: 'Low stock' },
];

const baseSnapshot: StorefrontContentSnapshot = {
  hero: {
    stripText: 'Free shipping over $300 · 14-day size exchange · new arrivals weekly',
    eyebrow: 'Curated sneaker boutique',
    headline: 'Modern sneakers with premium finish and easy everyday wear.',
    description: 'Explore a tighter edit of standout pairs, from clean runners to bold statement styles with clear sizing.',
    primaryCtaLabel: 'Shop collection',
    secondaryCtaLabel: 'Why shop here',
  },
  featuredDrop: {
    productId: '1',
    fallbackName: 'Next featured drop',
    fallbackBody: 'A new premium pair is arriving soon. Stay tuned for the next release.',
    actionLabel: 'View product',
  },
  trust: {
    eyebrow: 'Why shop here',
    headline: 'Designed to feel clear, calm, and premium from the first click.',
    items: [
      { eyebrow: 'Selection', title: 'Curated Selection', body: 'A focused edit of modern runners and statement pairs.' },
      { eyebrow: 'Delivery', title: 'Clear Delivery', body: 'Shipping timelines are easy to understand for all orders.' },
      { eyebrow: 'Support', title: 'Easy Support', body: 'Simple post-purchase support and practical size guidance.' },
    ],
  },
  faq: {
    eyebrow: 'FAQ',
    headline: 'Questions we hear most.',
    items: [
      { question: 'How long does shipping take?', answer: 'Standard delivery usually arrives in 2 to 4 business days.' },
      { question: 'Can I exchange for another size?', answer: 'Yes. Eligible pairs include a 14-day size exchange option.' },
      { question: 'Can I save styles for later?', answer: 'Yes. Use the heart icon to save styles to your account view.' },
      { question: 'What comes with each order?', answer: 'Orders include secure packaging, tracking, and support access.' },
    ],
  },
  cta: {
    eyebrow: 'Ready to choose your pair?',
    headline: 'Clean silhouettes, fast delivery, and easy size support across the full collection.',
    buttonLabel: 'Open bag',
    chips: ['New arrivals', 'Best sellers', 'Shipping', 'Returns', 'Contact'],
  },
  shipping: {
    title: 'Shipping',
    message: 'Standard delivery arrives in 2-4 business days, with express dispatch available at checkout.',
  },
  returns: {
    title: 'Returns',
    message: 'Need a different size? Eligible pairs include a 14-day size exchange window.',
  },
  updatedAt: null,
};

describe('AdminContentPage', () => {
  const contentListeners: Array<() => void> = [];

  beforeEach(() => {
    contentListeners.length = 0;
    mockedContentService.listSections.mockResolvedValue(sections);
    mockedContentService.getStorefrontContent.mockResolvedValue(baseSnapshot);
    mockedContentService.listFeaturedProducts.mockResolvedValue(featuredProducts);
    mockedContentService.saveStorefrontContent.mockResolvedValue({
      savedAt: '2026-03-25T09:30:00.000Z',
      snapshot: {
        ...baseSnapshot,
        updatedAt: '2026-03-25T09:30:00.000Z',
      },
    });
    mockedContentService.subscribe.mockImplementation((listener: () => void) => {
      contentListeners.push(listener);
      return () => undefined;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('blocks save when blocking validation issues exist', async () => {
    render(<AdminContentPage />);

    const stripInput = await screen.findByLabelText(/strip text/i);
    fireEvent.change(stripInput, { target: { value: 'Too short' } });
    fireEvent.click(screen.getByRole('button', { name: /save content/i }));

    expect(mockedContentService.saveStorefrontContent).not.toHaveBeenCalled();
    expect(await screen.findByText(/cannot save storefront content/i)).toBeInTheDocument();
  });

  it('saves scoped content updates and keeps featured product linked to catalog ids', async () => {
    render(<AdminContentPage />);

    await screen.findByLabelText(/featured product/i);
    fireEvent.change(screen.getByLabelText(/featured product/i), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: /save content/i }));

    await waitFor(() => {
      expect(mockedContentService.saveStorefrontContent).toHaveBeenCalledTimes(1);
    });

    expect(mockedContentService.saveStorefrontContent.mock.calls[0]?.[0]).toMatchObject({
      featuredDrop: { productId: '2' },
    });
    expect(await screen.findByText(/storefront content saved at/i)).toBeInTheDocument();
  });

  it('refreshes featured product publish state at save time and surfaces warning from current catalog truth', async () => {
    mockedContentService.listFeaturedProducts
      .mockResolvedValueOnce(featuredProducts)
      .mockResolvedValueOnce([
        { id: '1', name: 'Phantom Velocity X', brand: 'VeloSnak Elite', publishState: 'Draft', stockStatus: 'In stock' },
        { id: '2', name: 'Aero-Core Prototype', brand: 'VeloSnak Elite', publishState: 'Draft', stockStatus: 'Low stock' },
      ]);

    render(<AdminContentPage />);

    await screen.findByLabelText(/featured product/i);
    fireEvent.click(screen.getByRole('button', { name: /save content/i }));

    await waitFor(() => {
      expect(mockedContentService.saveStorefrontContent).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText(/warning: featured product "phantom velocity x" is currently draft\./i)).toBeInTheDocument();
  });

  it('keeps featured-product preview aligned with live catalog changes while the editor is open', async () => {
    mockedContentService.listFeaturedProducts
      .mockResolvedValueOnce(featuredProducts)
      .mockResolvedValueOnce([
        { id: '1', name: 'Phantom Velocity X', brand: 'VeloSnak Elite', publishState: 'Draft', stockStatus: 'In stock' },
        featuredProducts[1]!,
      ]);

    render(<AdminContentPage />);

    await screen.findByLabelText(/featured product/i);
    expect(screen.getByText('Published')).toBeInTheDocument();

    await act(async () => {
      contentListeners[0]?.();
    });

    await waitFor(() => {
      expect(screen.getByText(/storefront hero will use fallback name and body until this product is published\./i)).toBeInTheDocument();
    });
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });
});
