import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CartProvider } from '../../../cart/context/CartContext';
import { WishlistProvider } from '../../../wishlist/context/WishlistContext';
import { CART_STORAGE_KEY, WISHLIST_STORAGE_KEY } from '../../../../lib/storage';
import Navbar from '../Navbar';

const renderNavbar = () =>
  render(
    <MemoryRouter>
      <CartProvider>
        <WishlistProvider>
          <Navbar
            filter="All"
            setFilter={() => undefined}
            searchQuery=""
            setSearchQuery={() => undefined}
            isSearchOpen={false}
            setIsSearchOpen={() => undefined}
            onOpenProfile={() => undefined}
            onOpenCart={() => undefined}
          />
        </WishlistProvider>
      </CartProvider>
    </MemoryRouter>
  );

describe('Navbar mobile navigation', () => {
  beforeEach(() => {
    window.localStorage.removeItem(CART_STORAGE_KEY);
    window.localStorage.removeItem(WISHLIST_STORAGE_KEY);
  });

  afterEach(() => {
    window.localStorage.removeItem(CART_STORAGE_KEY);
    window.localStorage.removeItem(WISHLIST_STORAGE_KEY);
    document.body.style.overflow = '';
  });

  it('keeps the mobile nav closed by default and opens and closes from navbar controls', () => {
    renderNavbar();

    const dialog = screen.getByRole('dialog', { hidden: true });
    expect(dialog).toHaveAttribute('aria-hidden', 'true');
    expect(dialog).toHaveClass('invisible');
    expect(document.body.style.overflow).toBe('');

    fireEvent.click(screen.getByRole('button', { name: /open navigation/i }));

    expect(screen.getByRole('dialog', { name: /velosnak atelier/i })).toBe(dialog);
    expect(dialog).toHaveAttribute('aria-hidden', 'false');
    expect(dialog).not.toHaveClass('invisible');
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.click(screen.getByRole('button', { name: /close navigation/i }));

    expect(dialog).toHaveAttribute('aria-hidden', 'true');
    expect(dialog).toHaveClass('invisible');
    expect(document.body.style.overflow).toBe('');
  });
});
