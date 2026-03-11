import { createContext } from 'react';
import { Shoe } from '../types';

export interface WishlistContextType {
  wishlist: Shoe[];
  toggleWishlist: (shoe: Shoe) => void;
  isInWishlist: (shoeId: string) => boolean;
}

export const WishlistContext = createContext<WishlistContextType | undefined>(undefined);
