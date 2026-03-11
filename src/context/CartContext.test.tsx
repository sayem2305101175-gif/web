
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CartProvider } from './CartContext';
import { useCart } from './useCart';
import * as React from 'react';

const mockShoe = {
    id: '1',
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
    stockStatus: 'In stock' as const,
    shippingNote: 'Ships tomorrow',
    featuredNote: 'Great value',
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <CartProvider>{children}</CartProvider>
);

describe('CartContext', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('should start with an empty cart', () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        expect(result.current.cart).toEqual([]);
        expect(result.current.cartCount).toBe(0);
    });

    it('should add an item to the cart', () => {
        const { result } = renderHook(() => useCart(), { wrapper });

        act(() => {
            result.current.addToCart(mockShoe, 'US 9');
        });

        expect(result.current.cart).toHaveLength(1);
        expect(result.current.cart[0]).toMatchObject({ ...mockShoe, quantity: 1, selectedSize: 'US 9' });
        expect(result.current.cartCount).toBe(1);
        expect(result.current.cartTotal).toBe(150);
    });

    it('should increment quantity when adding the same item and size', () => {
        const { result } = renderHook(() => useCart(), { wrapper });

        act(() => {
            result.current.addToCart(mockShoe, 'US 9');
            result.current.addToCart(mockShoe, 'US 9');
        });

        expect(result.current.cart).toHaveLength(1);
        expect(result.current.cart[0]!.quantity).toBe(2);
        expect(result.current.cartCount).toBe(2);
        expect(result.current.cartTotal).toBe(300);
    });

    it('should create separate lines for different sizes', () => {
        const { result } = renderHook(() => useCart(), { wrapper });

        act(() => {
            result.current.addToCart(mockShoe, 'US 9');
            result.current.addToCart(mockShoe, 'US 10');
        });

        expect(result.current.cart).toHaveLength(2);
    });

    it('should remove an item from the cart', () => {
        const { result } = renderHook(() => useCart(), { wrapper });

        act(() => {
            result.current.addToCart(mockShoe, 'US 9');
        });

        const lineId = result.current.cart[0]!.lineId;

        act(() => {
            result.current.removeFromCart(lineId);
        });

        expect(result.current.cart).toHaveLength(0);
    });
});
