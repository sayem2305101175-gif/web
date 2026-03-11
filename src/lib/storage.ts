export const CART_STORAGE_KEY = 'velosnak_cart';
export const WISHLIST_STORAGE_KEY = 'velosnak_wishlist';
export const RECENT_ORDER_STORAGE_KEY = 'velosnak_recent_order';

export const readStoredJson = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const storedValue = window.localStorage.getItem(key);
    return storedValue ? (JSON.parse(storedValue) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const writeStoredJson = (key: string, value: unknown) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
};
