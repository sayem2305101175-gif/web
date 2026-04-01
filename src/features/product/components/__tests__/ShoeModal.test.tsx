import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SHOES } from '../../../../constants';
import { CartProvider } from '../../../cart/context/CartContext';
import { ToastProvider } from '../../../shared/context/ToastContext';
import { WishlistProvider } from '../../../wishlist/context/WishlistContext';
import ShoeModal from '../ShoeModal';

const primaryShoe = SHOES[0];

if (!primaryShoe) {
  throw new Error('Expected primary shoe fixture to exist.');
}

describe('ShoeModal', () => {
  it('shows an added-to-bag toast when the primary action is used', async () => {
    const onClose = vi.fn();

    render(
      <CartProvider>
        <WishlistProvider>
          <ToastProvider>
            <ShoeModal shoe={primaryShoe} onClose={onClose} />
          </ToastProvider>
        </WishlistProvider>
      </CartProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /add us 7 to bag/i }));

    expect(await screen.findByRole('status')).toHaveTextContent(/added to bag/i);
    expect(onClose).toHaveBeenCalled();
  });
});
