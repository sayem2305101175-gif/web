export type StockStatus = 'In stock' | 'Low stock' | 'Waitlist';

export interface Shoe {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  description: string;
  shortBlurb: string;
  colorway: string;
  hypeScore: number;
  accentColor: string;
  modelUrl: string;
  sizes: string[];
  materials: string[];
  stockStatus: StockStatus;
  shippingNote: string;
  featuredNote: string;
  isNew?: boolean;
}

export interface CartItem extends Shoe {
  lineId: string;
  quantity: number;
  selectedSize: string;
}

export interface OrderContact {
  name: string;
  email: string;
  city: string;
  country: string;
  delivery: 'Standard' | 'Express';
  notes: string;
}

export interface OrderSnapshot {
  id: string;
  createdAt: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  contact: OrderContact;
}
