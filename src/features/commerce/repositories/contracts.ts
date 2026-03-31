import type { OrderSnapshot } from '../../../types';
import type { StorefrontContentSnapshot } from '../../../content/storefront';
import type {
  CommerceOrderStatus,
  CommercePublishState,
  CommerceStockStatus,
  SharedOrderRecord,
  SharedProductRecord,
} from '../../admin/shared/types';

export type CommerceRepositoryListener = () => void;
export type CatalogRepositorySurface = 'admin' | 'storefront';

export interface CatalogRepositoryQuery {
  search?: string;
  brand?: string;
  category?: string;
  publishState?: CommercePublishState | 'All';
  stockStatus?: CommerceStockStatus | 'All';
  isNew?: boolean;
  surface?: CatalogRepositorySurface;
  storefrontVisibleOnly?: boolean;
}

export interface CatalogRepository {
  listProducts(query?: CatalogRepositoryQuery): Promise<SharedProductRecord[]>;
  getProductById(productId: string, options?: { surface?: CatalogRepositorySurface }): Promise<SharedProductRecord | null>;
  saveProduct(product: SharedProductRecord): Promise<SharedProductRecord>;
  duplicateProduct?(productId: string): Promise<SharedProductRecord | null>;
  setPublishState?(productId: string, publishState: CommercePublishState): Promise<SharedProductRecord | null>;
  subscribe?(listener: CommerceRepositoryListener): () => void;
}

export interface StorefrontContentRepository {
  getContent(): Promise<StorefrontContentSnapshot>;
  saveContent(content: StorefrontContentSnapshot): Promise<StorefrontContentSnapshot>;
  subscribe?(listener: CommerceRepositoryListener): () => void;
}

export interface OrderRepository {
  listOrders(): Promise<SharedOrderRecord[]>;
  getOrderById(orderId: string): Promise<SharedOrderRecord | null>;
  updateOrderStatus(orderId: string, status: CommerceOrderStatus): Promise<SharedOrderRecord | null>;
  submitOrder?(snapshot: OrderSnapshot): Promise<OrderSnapshot>;
  subscribe?(listener: CommerceRepositoryListener): () => void;
}

export interface CommerceRepositories {
  catalog: CatalogRepository;
  content: StorefrontContentRepository;
  orders: OrderRepository;
}
