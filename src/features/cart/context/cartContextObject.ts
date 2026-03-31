import { createContext } from 'react';
import { CartItem, Shoe } from '../../../types';

export interface CartContextType {
  cart: CartItem[];
  addToCart: (shoe: Shoe, selectedSize: string) => void;
  removeFromCart: (lineId: string) => void;
  updateQuantity: (lineId: string, delta: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);
