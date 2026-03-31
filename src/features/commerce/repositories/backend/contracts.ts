import type { OrderSnapshot, Shoe } from '../../../../types';
import type { StorefrontContentSnapshot } from '../../../../content/storefront';
import type {
  CommerceOrderStatus,
  CommercePublishState,
  SharedOrderRecord,
  SharedProductRecord,
} from '../../../admin/shared/types';

export type BackendCatalogShoe = Shoe & { publishState?: CommercePublishState };
export type BackendAdminCatalogRecordDto = SharedProductRecord;

export type BackendStorefrontContentDto = StorefrontContentSnapshot;

export type BackendOrderRecordDto = SharedOrderRecord;

export interface BackendOrderStatusUpdateDto {
  status: CommerceOrderStatus;
}

export type BackendOrderSubmissionDto = OrderSnapshot;
