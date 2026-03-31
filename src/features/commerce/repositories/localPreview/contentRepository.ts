import { sharedCommerceStore } from '../../../admin/shared/store';
import type { StorefrontContentRepository } from '../contracts';
import { createRepositorySubscriptionChannel } from '../subscriptions';

const contentSubscriptionChannel = createRepositorySubscriptionChannel();

export const localPreviewStorefrontContentRepository: StorefrontContentRepository = {
  async getContent() {
    return sharedCommerceStore.getContent();
  },

  async saveContent(content) {
    const savedContent = sharedCommerceStore.saveContent(content);
    contentSubscriptionChannel.emit();
    return savedContent;
  },

  subscribe(listener) {
    return contentSubscriptionChannel.subscribe(listener);
  },
};
