import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CartProvider } from '../../context/CartContext';
import CartDrawer from '../CartDrawer';
import { CART_STORAGE_KEY, RECENT_ORDER_STORAGE_KEY } from '../../lib/storage';
import { CartItem } from '../../types';

const apiPostMock = vi.hoisted(() => vi.fn());

vi.mock('../../services/apiClient', () => ({
  isBackendConfigured: true,
  apiClient: {
    get: vi.fn(),
    post: apiPostMock,
  },
  ApiError: class ApiError extends Error {
    status = 500;
    responseBody = null;
  },
}));

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

describe('CartDrawer (Backend Connected)', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(mockCart));
    apiPostMock.mockReset();
    apiPostMock.mockImplementation(async (_path: string, body: unknown) => body);
  });

  it('submits checkout and shows confirmation when backend mode is enabled', async () => {
    render(
      <CartProvider>
        <CartDrawer isOpen onClose={() => undefined} />
      </CartProvider>
    );

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'jane@example.com' } });
    fireEvent.change(screen.getByLabelText(/city/i), { target: { value: 'Dhaka' } });
    fireEvent.change(screen.getByLabelText(/country/i), { target: { value: 'Bangladesh' } });

    fireEvent.click(screen.getByRole('button', { name: /place order/i }));

    await screen.findByRole('heading', { name: /order confirmed/i });
    expect(apiPostMock).toHaveBeenCalledTimes(1);
    expect(apiPostMock).toHaveBeenCalledWith(
      '/api/orders',
      expect.objectContaining({
        contact: expect.objectContaining({
          name: 'Jane Doe',
          email: 'jane@example.com',
        }),
      })
    );
    expect(localStorage.getItem(RECENT_ORDER_STORAGE_KEY)).not.toBeNull();
  });
});
