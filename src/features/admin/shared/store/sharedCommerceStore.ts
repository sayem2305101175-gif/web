import {
  getStorefrontContentSnapshot,
  saveStorefrontContentSnapshot,
  sanitizeStorefrontContentSnapshot,
  type StorefrontContentSnapshot,
} from '../../../../content/storefront';
import { SHOES } from '../../../../constants';
import { readStoredJson, writeStoredJson } from '../../../../lib/storage';
import type { OrderSnapshot } from '../../../../types';
import type {
  CommerceOrderStatus,
  CommercePublishState,
  SharedOrderRecord,
  SharedProductRecord,
  SharedStorefrontContentRecord,
} from '../types';

export interface SharedCommerceStoreState {
  version: 1;
  products: SharedProductRecord[];
  content: SharedStorefrontContentRecord;
  orders: SharedOrderRecord[];
}

export const SHARED_COMMERCE_STORE_STORAGE_KEY = 'velosnak_admin_storefront_shared_v1';

const publishStateById: Record<string, CommercePublishState> = {
  '1': 'Published',
  '2': 'Draft',
  '3': 'Published',
  '4': 'Published',
  '5': 'Archived',
  '6': 'Draft',
  '7': 'Draft',
  '8': 'Published',
};

const quantityByStockStatus: Record<SharedProductRecord['stockStatus'], number> = {
  'In stock': 36,
  'Low stock': 7,
  Waitlist: 0,
};

const ORDER_SEED: SharedOrderRecord[] = [
  {
    id: 'WS-1048',
    createdAt: '2026-03-22T10:24:00.000Z',
    status: 'Processing',
    itemCount: 2,
    subtotal: 575,
    shippingFee: 36,
    total: 611,
    updatedAt: null,
    contact: {
      name: 'Ariana Walker',
      email: 'ariana.walker@example.com',
      phone: '+1 415 555 0198',
      city: 'San Francisco',
      country: 'USA',
      shippingAddress: '188 Mission St, Apt 52',
      deliveryMethod: 'Express',
      notes: 'Please ring front desk before delivery.',
    },
    lineItems: [
      {
        id: 'ws-1048-li-1',
        productId: '1',
        productName: 'Phantom Velocity X',
        size: 'US 10',
        quantity: 1,
        unitPrice: 295,
        lineTotal: 295,
      },
      {
        id: 'ws-1048-li-2',
        productId: '4',
        productName: 'Zenith Void Runner',
        size: 'US 9',
        quantity: 1,
        unitPrice: 280,
        lineTotal: 280,
      },
    ],
  },
  {
    id: 'WS-1047',
    createdAt: '2026-03-21T15:42:00.000Z',
    status: 'Pending',
    itemCount: 1,
    subtotal: 240,
    shippingFee: 14,
    total: 254,
    updatedAt: null,
    contact: {
      name: 'Daniel Park',
      email: 'daniel.park@example.com',
      phone: '+1 312 555 0126',
      city: 'Chicago',
      country: 'USA',
      shippingAddress: '451 W Belmont Ave',
      deliveryMethod: 'Standard',
      notes: 'Leave at side entrance if unavailable.',
    },
    lineItems: [
      {
        id: 'ws-1047-li-1',
        productId: '2',
        productName: 'Aero-Core Prototype',
        size: 'US 9',
        quantity: 1,
        unitPrice: 240,
        lineTotal: 240,
      },
    ],
  },
  {
    id: 'WS-1046',
    createdAt: '2026-03-20T07:18:00.000Z',
    status: 'Shipped',
    itemCount: 3,
    subtotal: 735,
    shippingFee: 36,
    total: 771,
    updatedAt: null,
    contact: {
      name: 'Nora Martinez',
      email: 'nora.martinez@example.com',
      phone: '+1 786 555 0161',
      city: 'Miami',
      country: 'USA',
      shippingAddress: '92 Biscayne Blvd',
      deliveryMethod: 'Express',
      notes: 'Customer requested SMS delivery alert.',
    },
    lineItems: [
      {
        id: 'ws-1046-li-1',
        productId: '3',
        productName: 'Cyber-Dunk Catalyst',
        size: 'US 10',
        quantity: 1,
        unitPrice: 185,
        lineTotal: 185,
      },
      {
        id: 'ws-1046-li-2',
        productId: '6',
        productName: 'Titanium Trek High',
        size: 'US 11',
        quantity: 1,
        unitPrice: 350,
        lineTotal: 350,
      },
      {
        id: 'ws-1046-li-3',
        productId: '5',
        productName: 'Prism Flux Low',
        size: 'US 8',
        quantity: 1,
        unitPrice: 200,
        lineTotal: 200,
      },
    ],
  },
  {
    id: 'WS-1045',
    createdAt: '2026-03-18T19:06:00.000Z',
    status: 'Delivered',
    itemCount: 1,
    subtotal: 295,
    shippingFee: 13,
    total: 308,
    updatedAt: null,
    contact: {
      name: 'Samuel Greene',
      email: 'samuel.greene@example.com',
      phone: '+1 646 555 0183',
      city: 'New York',
      country: 'USA',
      shippingAddress: '77 Hudson Yards',
      deliveryMethod: 'Standard',
      notes: 'Delivered to building concierge.',
    },
    lineItems: [
      {
        id: 'ws-1045-li-1',
        productId: '1',
        productName: 'Phantom Velocity X',
        size: 'US 9',
        quantity: 1,
        unitPrice: 295,
        lineTotal: 295,
      },
    ],
  },
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const cloneContent = (snapshot: StorefrontContentSnapshot): StorefrontContentSnapshot => ({
  ...snapshot,
  hero: { ...snapshot.hero },
  featuredDrop: { ...snapshot.featuredDrop },
  trust: {
    ...snapshot.trust,
    items: snapshot.trust.items.map((item) => ({ ...item })),
  },
  faq: {
    ...snapshot.faq,
    items: snapshot.faq.items.map((item) => ({ ...item })),
  },
  cta: {
    ...snapshot.cta,
    chips: [...snapshot.cta.chips],
  },
  shipping: { ...snapshot.shipping },
  returns: { ...snapshot.returns },
});

const cloneProduct = (product: SharedProductRecord): SharedProductRecord => ({
  ...product,
  sizes: [...product.sizes],
  materials: [...product.materials],
});

const cloneOrder = (order: SharedOrderRecord): SharedOrderRecord => ({
  ...order,
  contact: { ...order.contact },
  lineItems: order.lineItems.map((lineItem) => ({ ...lineItem })),
});

const cloneState = (state: SharedCommerceStoreState): SharedCommerceStoreState => ({
  version: 1,
  products: state.products.map(cloneProduct),
  content: cloneContent(state.content),
  orders: state.orders.map(cloneOrder),
});

const isStoreState = (value: unknown): value is SharedCommerceStoreState => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value['version'] === 1 &&
    Array.isArray(value['products']) &&
    isRecord(value['content']) &&
    Array.isArray(value['orders'])
  );
};

const createSeedProducts = (): SharedProductRecord[] =>
  SHOES.map((shoe) => ({
    id: shoe.id,
    name: shoe.name,
    brand: shoe.brand,
    category: shoe.category,
    colorway: shoe.colorway,
    price: shoe.price,
    compareAtPrice: shoe.compareAtPrice ?? 0,
    stockStatus: shoe.stockStatus,
    quantityOnHand: quantityByStockStatus[shoe.stockStatus],
    sizes: [...shoe.sizes],
    materials: [...shoe.materials],
    shortBlurb: shoe.shortBlurb,
    description: shoe.description,
    image: shoe.image,
    modelUrl: shoe.modelUrl,
    shippingNote: shoe.shippingNote,
    featuredNote: shoe.featuredNote,
    accentColor: shoe.accentColor,
    hypeScore: shoe.hypeScore,
    isNew: Boolean(shoe.isNew),
    publishState: publishStateById[shoe.id] ?? 'Draft',
    updatedAt: null,
  }));

const createSeedState = (): SharedCommerceStoreState => ({
  version: 1,
  products: createSeedProducts(),
  content: sanitizeStorefrontContentSnapshot(getStorefrontContentSnapshot()),
  orders: ORDER_SEED.map(cloneOrder),
});

const readState = (): SharedCommerceStoreState => {
  const stored = readStoredJson<unknown>(SHARED_COMMERCE_STORE_STORAGE_KEY, null);

  if (isStoreState(stored)) {
    return cloneState({
      ...stored,
      products: (stored['products'] as SharedProductRecord[]).map(cloneProduct),
      content: sanitizeStorefrontContentSnapshot(stored['content']),
      orders: (stored['orders'] as SharedOrderRecord[]).map(cloneOrder),
    });
  }

  const seeded = createSeedState();
  writeStoredJson(SHARED_COMMERCE_STORE_STORAGE_KEY, seeded);
  return cloneState(seeded);
};

const writeState = (state: SharedCommerceStoreState): SharedCommerceStoreState => {
  const clonedState = cloneState(state);
  writeStoredJson(SHARED_COMMERCE_STORE_STORAGE_KEY, clonedState);
  return clonedState;
};

const updateState = (updater: (currentState: SharedCommerceStoreState) => SharedCommerceStoreState) => {
  const currentState = readState();
  const nextState = updater(currentState);
  return writeState(nextState);
};

const getProductIndexById = (products: SharedProductRecord[], productId: string) =>
  products.findIndex((product) => product.id === productId);

const getOrderIndexById = (orders: SharedOrderRecord[], orderId: string) =>
  orders.findIndex((order) => order.id === orderId);

const createUniqueOrderId = (orders: SharedOrderRecord[], desiredId: string) => {
  if (!orders.some((order) => order.id === desiredId)) {
    return desiredId;
  }

  let nextSuffix = 2;
  let nextId = `${desiredId}-${nextSuffix}`;
  while (orders.some((order) => order.id === nextId)) {
    nextSuffix += 1;
    nextId = `${desiredId}-${nextSuffix}`;
  }

  return nextId;
};

const toSharedOrderRecord = (snapshot: OrderSnapshot): SharedOrderRecord => ({
  id: snapshot.id,
  createdAt: snapshot.createdAt,
  status: 'Pending',
  itemCount: snapshot.items.reduce((total, item) => total + item.quantity, 0),
  subtotal: snapshot.subtotal,
  shippingFee: snapshot.shipping,
  total: snapshot.total,
  updatedAt: null,
  contact: {
    name: snapshot.contact.name,
    email: snapshot.contact.email,
    phone: '',
    city: snapshot.contact.city,
    country: snapshot.contact.country,
    shippingAddress: '',
    deliveryMethod: snapshot.contact.delivery,
    notes: snapshot.contact.notes,
  },
  lineItems: snapshot.items.map((item) => ({
    id: item.lineId,
    productId: item.id,
    productName: item.name,
    size: item.selectedSize,
    quantity: item.quantity,
    unitPrice: item.price,
    lineTotal: item.price * item.quantity,
  })),
});

export const sharedCommerceStore = {
  getState(): SharedCommerceStoreState {
    return readState();
  },

  saveState(nextState: SharedCommerceStoreState): SharedCommerceStoreState {
    return writeState(nextState);
  },

  getProducts(): SharedProductRecord[] {
    return readState().products;
  },

  getProductById(productId: string): SharedProductRecord | null {
    const product = readState().products.find((item) => item.id === productId);
    return product ? cloneProduct(product) : null;
  },

  saveProducts(products: SharedProductRecord[]): SharedProductRecord[] {
    const nextState = updateState((currentState) => ({
      ...currentState,
      products: products.map(cloneProduct),
    }));

    return nextState.products.map(cloneProduct);
  },

  upsertProduct(product: SharedProductRecord): SharedProductRecord {
    const nextState = updateState((currentState) => {
      const nextProducts = currentState.products.map(cloneProduct);
      const existingIndex = getProductIndexById(nextProducts, product.id);
      const nextProduct = cloneProduct(product);

      if (existingIndex === -1) {
        nextProducts.push(nextProduct);
      } else {
        nextProducts[existingIndex] = nextProduct;
      }

      return {
        ...currentState,
        products: nextProducts,
      };
    });

    const savedProduct = nextState.products.find((item) => item.id === product.id);
    return savedProduct ? cloneProduct(savedProduct) : cloneProduct(product);
  },

  getContent(): SharedStorefrontContentRecord {
    return cloneContent(readState().content);
  },

  saveContent(content: SharedStorefrontContentRecord): SharedStorefrontContentRecord {
    const persistedContent = saveStorefrontContentSnapshot(content);

    const nextState = updateState((currentState) => ({
      ...currentState,
      content: cloneContent(persistedContent),
    }));

    return cloneContent(nextState.content);
  },

  getOrders(): SharedOrderRecord[] {
    return readState().orders;
  },

  getOrderById(orderId: string): SharedOrderRecord | null {
    const order = readState().orders.find((item) => item.id === orderId);
    return order ? cloneOrder(order) : null;
  },

  saveOrders(orders: SharedOrderRecord[]): SharedOrderRecord[] {
    const nextState = updateState((currentState) => ({
      ...currentState,
      orders: orders.map(cloneOrder),
    }));

    return nextState.orders.map(cloneOrder);
  },

  createOrderFromSnapshot(snapshot: OrderSnapshot): OrderSnapshot {
    const normalizedSnapshot = updateState((currentState) => {
      const nextOrders = currentState.orders.map(cloneOrder);
      const nextSnapshot: OrderSnapshot = {
        ...snapshot,
        id: createUniqueOrderId(nextOrders, snapshot.id),
        items: snapshot.items.map((item) => ({ ...item })),
        contact: { ...snapshot.contact },
      };

      nextOrders.unshift(toSharedOrderRecord(nextSnapshot));

      return {
        ...currentState,
        orders: nextOrders,
      };
    });

    const createdOrder = normalizedSnapshot.orders[0];
    if (!createdOrder) {
      return {
        ...snapshot,
        items: snapshot.items.map((item) => ({ ...item })),
        contact: { ...snapshot.contact },
      };
    }

    return {
      id: createdOrder.id,
      createdAt: createdOrder.createdAt,
      items: snapshot.items.map((item) => ({ ...item })),
      subtotal: createdOrder.subtotal,
      shipping: createdOrder.shippingFee,
      total: createdOrder.total,
      contact: {
        ...snapshot.contact,
        delivery: createdOrder.contact.deliveryMethod,
      },
    };
  },

  updateOrderStatus(orderId: string, status: CommerceOrderStatus): SharedOrderRecord | null {
    const now = new Date().toISOString();
    const nextState = updateState((currentState) => {
      const nextOrders = currentState.orders.map(cloneOrder);
      const targetIndex = getOrderIndexById(nextOrders, orderId);

      if (targetIndex === -1) {
        return currentState;
      }

      const targetOrder = nextOrders[targetIndex];
      if (!targetOrder) {
        return currentState;
      }

      nextOrders[targetIndex] = {
        ...targetOrder,
        status,
        updatedAt: now,
      };

      return {
        ...currentState,
        orders: nextOrders,
      };
    });

    const updatedOrder = nextState.orders.find((order) => order.id === orderId);
    return updatedOrder ? cloneOrder(updatedOrder) : null;
  },
};
