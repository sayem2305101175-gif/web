import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CartProvider } from '../../context/CartContext';
import { CART_STORAGE_KEY, RECENT_ORDER_STORAGE_KEY } from '../../lib/storage';
import { CartItem } from '../../types';
import { sharedCommerceStore } from '../../features/admin/shared/store';

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

import CartDrawer from '../CartDrawer';

const mockCart: CartItem[] = [
  {
    id: '1',
    lineId: '1-us-9',
    name: 'Test Shoe',
    brand: 'Test Brand',
    category: 'Lifestyle',
    price: 150,
    compareAtPrice: 180,
    image: 'test.jpg',
    description: 'Test description',
    shortBlurb: 'Short description',
    colorway: 'Test colorway',
    hypeScore: 85,
    accentColor: '#000000',
    modelUrl: 'test.glb',
    sizes: ['US 9', 'US 10'],
    materials: ['Mesh upper'],
    stockStatus: 'In stock',
    shippingNote: 'Ships tomorrow',
    featuredNote: 'Great value',
    quantity: 1,
    selectedSize: 'US 9',
  },
];

const renderCartDrawer = () =>
  render(
    <CartProvider>
      <CartDrawer isOpen onClose={() => undefined} />
    </CartProvider>
  );

describe('CartDrawer', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(mockCart));
  });

  it('submits checkout through the self-contained local-preview order flow', async () => {
    renderCartDrawer();

    expect(screen.queryByText(/order submission is currently unavailable in this build/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Step Five Tester' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'step5@example.com' } });
    fireEvent.change(screen.getByLabelText(/city/i), { target: { value: 'Dhaka' } });
    fireEvent.change(screen.getByLabelText(/country/i), { target: { value: 'Bangladesh' } });

    fireEvent.click(screen.getByRole('button', { name: /place order/i }));

    await screen.findByRole('heading', { name: /order confirmed/i });
    const storedRecentOrder = JSON.parse(localStorage.getItem(RECENT_ORDER_STORAGE_KEY) ?? 'null') as {
      contact?: { email?: string };
    } | null;
    expect(storedRecentOrder?.contact?.email).toBe('step5@example.com');
    expect(sharedCommerceStore.getOrders()[0]?.contact.email).toBe('step5@example.com');
    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? 'null')).toEqual([]);
    });
  });
});
