import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ThreeDShoeCard from '../ThreeDShoeCard';
import { WishlistProvider } from '../../context/WishlistContext';
import * as React from 'react';
import type { Shoe } from '../../types';

const mockShoe: Shoe = {
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
  stockStatus: 'In stock',
  shippingNote: 'Ships tomorrow',
  featuredNote: 'Great value',
};

const renderWithProviders = (ui: React.ReactElement) => render(<WishlistProvider>{ui}</WishlistProvider>);

describe('ThreeDShoeCard', () => {
  it('renders shoe information correctly', () => {
    renderWithProviders(<ThreeDShoeCard shoe={mockShoe} onClick={() => undefined} />);

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

  it('opens details when pressing Enter on the card', () => {
    const onClick = vi.fn();
    renderWithProviders(<ThreeDShoeCard shoe={mockShoe} onClick={onClick} />);

    fireEvent.keyDown(screen.getByRole('button', { name: /open details for test shoe/i }), {
      key: 'Enter',
    });
    expect(onClick).toHaveBeenCalledWith(mockShoe);
  });

  it('contains a wishlist toggle button', () => {
    renderWithProviders(<ThreeDShoeCard shoe={mockShoe} onClick={() => undefined} />);
    const wishlistButton = screen.getByRole('button', { name: /add to wishlist|remove from wishlist/i });
    expect(wishlistButton).toBeInTheDocument();
  });

  it('does not open details when toggling wishlist', () => {
    const onClick = vi.fn();
    renderWithProviders(<ThreeDShoeCard shoe={mockShoe} onClick={onClick} />);

    const wishlistButton = screen.getByRole('button', { name: /add to wishlist/i });
    fireEvent.click(wishlistButton);

    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /remove from wishlist/i })).toBeInTheDocument();
  });

  it('does not open details when the 3D viewer surface is clicked', () => {
    const onClick = vi.fn();
    const { container } = renderWithProviders(<ThreeDShoeCard shoe={mockShoe} onClick={onClick} />);

    const viewer = container.querySelector('model-viewer');
    expect(viewer).not.toBeNull();

    fireEvent.click(viewer as Element);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('resets the 3D viewer orbit after user interaction ends', () => {
    vi.useFakeTimers();
    try {
      const { container } = renderWithProviders(<ThreeDShoeCard shoe={mockShoe} onClick={() => undefined} />);
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
      viewer!.resetTurntableRotation = vi.fn();

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
      expect(viewer!.resetTurntableRotation).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('falls back to image preview when no model URL is available', () => {
    const onClick = vi.fn();
    const shoeWithoutModel = { ...mockShoe, modelUrl: '' };

    renderWithProviders(<ThreeDShoeCard shoe={shoeWithoutModel} onClick={onClick} />);

    expect(screen.getByRole('img', { name: /test shoe preview/i })).toBeInTheDocument();
    expect(screen.queryByText(/3d viewer unavailable/i)).not.toBeInTheDocument();
  });

  it('falls back to image preview when model-viewer fails to load', async () => {
    const onClick = vi.fn();
    const { container } = renderWithProviders(<ThreeDShoeCard shoe={mockShoe} onClick={onClick} />);

    const viewer = container.querySelector('model-viewer');
    expect(viewer).not.toBeNull();

    fireEvent(viewer as Element, new Event('error'));

    const fallbackPreview = await screen.findByRole('img', { name: /test shoe preview/i });
    expect(fallbackPreview).toBeInTheDocument();
    fireEvent.click(fallbackPreview);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('keeps click isolation when using fallback preview', () => {
    const onClick = vi.fn();
    const shoeWithoutModel = { ...mockShoe, modelUrl: '' };
    renderWithProviders(<ThreeDShoeCard shoe={shoeWithoutModel} onClick={onClick} />);

    fireEvent.click(screen.getByRole('img', { name: /test shoe preview/i }));
    expect(onClick).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Test Shoe'));
    expect(onClick).toHaveBeenCalledWith(shoeWithoutModel);
  });
});
