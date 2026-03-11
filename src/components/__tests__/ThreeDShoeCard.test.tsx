
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ThreeDShoeCard from '../ThreeDShoeCard';
import { WishlistProvider } from '../../context/WishlistContext';
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

const renderWithProviders = (ui: React.ReactElement) => {
    return render(
        <WishlistProvider>
            {ui}
        </WishlistProvider>
    );
};

describe('ThreeDShoeCard', () => {
    it('renders shoe information correctly', () => {
        renderWithProviders(<ThreeDShoeCard shoe={mockShoe} onClick={() => { }} />);

        expect(screen.getByText('Test Shoe')).toBeInTheDocument();
        expect(screen.getByText('Test Brand')).toBeInTheDocument();
        expect(screen.getByText('$150')).toBeInTheDocument();
    });

    it('calls onClick when the card is clicked', () => {
        const onClick = vi.fn();
        renderWithProviders(<ThreeDShoeCard shoe={mockShoe} onClick={onClick} />);

        fireEvent.click(screen.getByText('Test Shoe'));
        expect(onClick).toHaveBeenCalledWith(mockShoe);
    });

    it('contains a wishlist toggle button', () => {
        renderWithProviders(<ThreeDShoeCard shoe={mockShoe} onClick={() => { }} />);
        const wishlistBtn = screen.getByRole('button', { name: /add to wishlist|remove from wishlist/i });
        expect(wishlistBtn).toBeInTheDocument();
    });

    it('does not open details when the 3d viewer is clicked', () => {
        const onClick = vi.fn();
        const { container } = renderWithProviders(<ThreeDShoeCard shoe={mockShoe} onClick={onClick} />);

        const viewer = container.querySelector('model-viewer');
        expect(viewer).not.toBeNull();

        fireEvent.click(viewer!);
        expect(onClick).not.toHaveBeenCalled();
    });

    it('resets the 3d viewer orbit after interaction ends', () => {
        vi.useFakeTimers();

        const { container } = renderWithProviders(<ThreeDShoeCard shoe={mockShoe} onClick={() => { }} />);
        const viewer = container.querySelector('model-viewer') as (HTMLElement & {
            cameraOrbit: string;
            cameraTarget: string;
            fieldOfView: string;
            resetTurntableRotation: ReturnType<typeof vi.fn>;
        }) | null;

        expect(viewer).not.toBeNull();

        viewer!.cameraOrbit = '90deg 60deg 140%';
        viewer!.cameraTarget = '1m 1m 1m';
        viewer!.fieldOfView = '35deg';
        fireEvent(
            viewer!,
            new CustomEvent('camera-change', {
                detail: { source: 'user-interaction' },
            })
        );
        vi.advanceTimersByTime(850);

        expect(viewer!.cameraOrbit).toBe('0deg 75deg 105%');
        expect(viewer!.cameraTarget).toBe('auto auto auto');
        expect(viewer!.fieldOfView).toBe('auto');
        expect(viewer!.resetTurntableRotation).toHaveBeenCalled();

        vi.useRealTimers();
    });
});
