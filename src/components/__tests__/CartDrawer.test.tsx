import * as React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CartProvider } from '../../context/CartContext';
import { CART_STORAGE_KEY } from '../../lib/storage';
import { CartItem } from '../../types';

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

  it('shows preview checkout messaging when no backend is configured', () => {
    renderCartDrawer();

    expect(screen.getByText(/live checkout is not connected in this deployment yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /checkout unavailable in preview/i })).toBeDisabled();
  });
});
