import React, { useEffect, useState, ReactNode } from 'react';
import { CartItem, Shoe } from '../../../types';
import { CART_STORAGE_KEY, readStoredJson, writeStoredJson } from '../../../lib/storage';
import { CartContext } from './cartContextObject';

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() =>
    readStoredJson<CartItem[]>(CART_STORAGE_KEY, [])
  );

  useEffect(() => {
    writeStoredJson(CART_STORAGE_KEY, cart);
  }, [cart]);

  const addToCart = (shoe: Shoe, selectedSize: string) => {
    setCart((previousCart) => {
      const existingLine = previousCart.find(
        (item) => item.id === shoe.id && item.selectedSize === selectedSize
      );

      if (existingLine) {
        return previousCart.map((item) =>
          item.lineId === existingLine.lineId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...previousCart,
        {
          ...shoe,
          lineId: `${shoe.id}-${selectedSize.replace(/\s+/g, '-').toLowerCase()}`,
          quantity: 1,
          selectedSize,
        },
      ];
    });
  };

  const removeFromCart = (lineId: string) => {
    setCart((previousCart) => previousCart.filter((item) => item.lineId !== lineId));
  };

  const updateQuantity = (lineId: string, delta: number) => {
    setCart((previousCart) => {
      const targetItem = previousCart.find((item) => item.lineId === lineId);

      if (targetItem?.quantity === 1 && delta < 0) {
        return previousCart.filter((item) => item.lineId !== lineId);
      }

      return previousCart.map((item) => {
        if (item.lineId !== lineId) {
          return item;
        }

        return {
          ...item,
          quantity: Math.max(1, item.quantity + delta),
        };
      });
    });
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((accumulator, item) => accumulator + item.price * item.quantity, 0);
  const cartCount = cart.reduce((accumulator, item) => accumulator + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount }}
    >
      {children}
    </CartContext.Provider>
  );
};
