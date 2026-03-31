export type AdminPublishState = 'Draft' | 'Published' | 'Archived';
export type AdminInventoryState = 'In stock' | 'Low stock' | 'Waitlist';
export type AdminOrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface AdminCatalogProductSummary {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  stockStatus: AdminInventoryState;
  publishState: AdminPublishState;
  hasHeroImage: boolean;
  hasModel3d: boolean;
  hasShortBlurb: boolean;
  hasDescription: boolean;
  hasSizeMatrix: boolean;
  hasMaterialProfile: boolean;
}

export interface AdminProductEditorDraft {
  id: string;
  name: string;
  brand: string;
  category: string;
  colorway: string;
  price: number;
  compareAtPrice: number;
  stockStatus: AdminInventoryState;
  quantityOnHand: number;
  sizes: string[];
  materials: string[];
  shortBlurb: string;
  description: string;
  image: string;
  modelUrl: string;
  publishState: AdminPublishState;
}

export interface AdminOrderSummary {
  id: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  deliveryMethod: 'Standard' | 'Express';
  itemCount: number;
  total: number;
  status: AdminOrderStatus;
}

export interface AdminOrderLineItem {
  id: string;
  productId: string;
  productName: string;
  size: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface AdminOrderDetail extends AdminOrderSummary {
  customerPhone: string;
  shippingCity: string;
  shippingCountry: string;
  shippingAddress: string;
  notes: string;
  subtotal: number;
  shippingFee: number;
  lineItems: AdminOrderLineItem[];
}

export interface AdminContentSection {
  id: string;
  name: string;
  description: string;
  lastUpdatedAt: string | null;
}

export interface AdminFeaturedProductOption {
  id: string;
  name: string;
  brand: string;
  publishState: AdminPublishState;
  stockStatus: AdminInventoryState;
}
