import React, { useEffect, useState, ReactNode } from 'react';
import { Shoe } from '../../../types';
import { readStoredJson, WISHLIST_STORAGE_KEY, writeStoredJson } from '../../../lib/storage';
import { WishlistContext } from './wishlistContextObject';

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<Shoe[]>(() =>
    readStoredJson<Shoe[]>(WISHLIST_STORAGE_KEY, [])
  );

  useEffect(() => {
    writeStoredJson(WISHLIST_STORAGE_KEY, wishlist);
  }, [wishlist]);

  const toggleWishlist = (shoe: Shoe) => {
    setWishlist((previousWishlist) => {
      const exists = previousWishlist.some((item) => item.id === shoe.id);

      if (exists) {
        return previousWishlist.filter((item) => item.id !== shoe.id);
      }

      return [...previousWishlist, shoe];
    });
  };

  const isInWishlist = (shoeId: string) => wishlist.some((item) => item.id === shoeId);

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};
