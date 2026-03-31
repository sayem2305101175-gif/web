import type { StorefrontContentSnapshot } from '../../../../content/storefront';

export type CommercePublishState = 'Draft' | 'Published' | 'Archived';
export type CommerceStockStatus = 'In stock' | 'Low stock' | 'Waitlist';
export type CommerceDeliveryMethod = 'Standard' | 'Express';
export type CommerceOrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface SharedProductRecord {
  id: string;
  name: string;
  brand: string;
  category: string;
  colorway: string;
  price: number;
  compareAtPrice: number;
  stockStatus: CommerceStockStatus;
  quantityOnHand: number;
  sizes: string[];
  materials: string[];
  shortBlurb: string;
  description: string;
  image: string;
  modelUrl: string;
  shippingNote: string;
  featuredNote: string;
  accentColor: string;
  hypeScore: number;
  isNew: boolean;
  publishState: CommercePublishState;
  updatedAt: string | null;
}

export interface StorefrontProductView {
  id: string;
  name: string;
  brand: string;
  category: string;
  colorway: string;
  price: number;
  compareAtPrice: number;
  stockStatus: CommerceStockStatus;
  sizes: string[];
  materials: string[];
  shortBlurb: string;
  description: string;
  image: string;
  modelUrl: string;
  shippingNote: string;
  featuredNote: string;
  accentColor: string;
  hypeScore: number;
  isNew: boolean;
}

export interface SharedOrderLineItemRecord {
  id: string;
  productId: string;
  productName: string;
  size: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface SharedOrderContactRecord {
  name: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  shippingAddress: string;
  deliveryMethod: CommerceDeliveryMethod;
  notes: string;
}

export interface SharedOrderRecord {
  id: string;
  createdAt: string;
  status: CommerceOrderStatus;
  itemCount: number;
  subtotal: number;
  shippingFee: number;
  total: number;
  contact: SharedOrderContactRecord;
  lineItems: SharedOrderLineItemRecord[];
  updatedAt: string | null;
}

export type SharedStorefrontContentRecord = StorefrontContentSnapshot;

export const STOREFRONT_VISIBLE_PUBLISH_STATES = ['Published'] as const satisfies readonly CommercePublishState[];

export const STOREFRONT_PRODUCT_FIELDS = [
  'id',
  'name',
  'brand',
  'category',
  'colorway',
  'price',
  'compareAtPrice',
  'stockStatus',
  'sizes',
  'materials',
  'shortBlurb',
  'description',
  'image',
  'modelUrl',
  'shippingNote',
  'featuredNote',
  'accentColor',
  'hypeScore',
  'isNew',
] as const satisfies readonly (keyof SharedProductRecord)[];

export const OPERATIONAL_PRODUCT_FIELDS = [
  'publishState',
  'quantityOnHand',
  'updatedAt',
] as const satisfies readonly (keyof SharedProductRecord)[];

export const STOREFRONT_ORDER_FIELDS = [
  'id',
  'createdAt',
  'itemCount',
  'subtotal',
  'shippingFee',
  'total',
  'contact',
  'lineItems',
] as const satisfies readonly (keyof SharedOrderRecord)[];

export const OPERATIONAL_ORDER_FIELDS = [
  'status',
  'updatedAt',
] as const satisfies readonly (keyof SharedOrderRecord)[];

export const isPublishStateStorefrontVisible = (publishState: CommercePublishState) =>
  publishState === 'Published';

export const toStorefrontProductView = (product: SharedProductRecord): StorefrontProductView => ({
  id: product.id,
  name: product.name,
  brand: product.brand,
  category: product.category,
  colorway: product.colorway,
  price: product.price,
  compareAtPrice: product.compareAtPrice,
  stockStatus: product.stockStatus,
  sizes: [...product.sizes],
  materials: [...product.materials],
  shortBlurb: product.shortBlurb,
  description: product.description,
  image: product.image,
  modelUrl: product.modelUrl,
  shippingNote: product.shippingNote,
  featuredNote: product.featuredNote,
  accentColor: product.accentColor,
  hypeScore: product.hypeScore,
  isNew: product.isNew,
});
