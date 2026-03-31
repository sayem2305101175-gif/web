import type { AdminCatalogProductSummary, AdminProductEditorDraft } from '../types';

export const PUBLISH_REQUIRED_FIELD_LABELS = [
  'Name',
  'Brand',
  'Category',
  'Price',
  'Sizes',
  'Materials',
  'Short blurb',
  'Description',
  'Hero image',
  '3D model',
] as const;

export interface PublishReadinessReport {
  blockingIssues: string[];
  warnings: string[];
  requiredPassed: number;
  requiredTotal: number;
}

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value.trim());

const isModelFileUrl = (value: string) => /\.(glb|gltf)(\?|#|$)/i.test(value.trim());

export const getEditorPublishReadiness = (
  draft: AdminProductEditorDraft,
  options: { heroPreviewFailed: boolean; modelPreviewFailed: boolean }
): PublishReadinessReport => {
  const blockingIssues: string[] = [];
  const warnings: string[] = [];
  let requiredPassed = 0;

  if (draft.name.trim()) {
    requiredPassed += 1;
  } else {
    blockingIssues.push('Name is required.');
  }

  if (draft.brand.trim()) {
    requiredPassed += 1;
  } else {
    blockingIssues.push('Brand is required.');
  }

  if (draft.category.trim()) {
    requiredPassed += 1;
  } else {
    blockingIssues.push('Category is required.');
  }

  if (draft.price > 0) {
    requiredPassed += 1;
  } else {
    blockingIssues.push('Price must be greater than zero.');
  }

  if (draft.sizes.length > 0) {
    requiredPassed += 1;
  } else {
    blockingIssues.push('At least one size is required.');
  }

  if (draft.materials.length > 0) {
    requiredPassed += 1;
  } else {
    blockingIssues.push('At least one material is required.');
  }

  if (draft.shortBlurb.trim().length >= 10) {
    requiredPassed += 1;
  } else {
    blockingIssues.push('Short blurb should be at least 10 characters.');
  }

  if (draft.description.trim().length >= 40) {
    requiredPassed += 1;
  } else {
    blockingIssues.push('Description should be at least 40 characters.');
  }

  if (draft.image.trim() && isAbsoluteUrl(draft.image)) {
    requiredPassed += 1;
  } else {
    blockingIssues.push('Hero image must be an absolute URL.');
  }

  if (draft.modelUrl.trim() && isAbsoluteUrl(draft.modelUrl)) {
    requiredPassed += 1;
  } else {
    blockingIssues.push('3D model must be an absolute URL.');
  }

  if (draft.compareAtPrice > 0 && draft.compareAtPrice < draft.price) {
    warnings.push('Compare-at price is lower than active selling price.');
  }

  if (draft.stockStatus === 'Low stock') {
    warnings.push('Product is publishable but inventory is low.');
  }

  if (draft.stockStatus === 'Waitlist') {
    warnings.push('Product is publishable but currently set to waitlist.');
  }

  if (options.heroPreviewFailed) {
    warnings.push('Hero image URL is set but preview failed to load.');
  }

  if (options.modelPreviewFailed) {
    warnings.push('3D model URL is set but preview failed to load.');
  }

  if (draft.modelUrl.trim() && !isModelFileUrl(draft.modelUrl)) {
    warnings.push('3D model URL does not look like a .glb or .gltf asset.');
  }

  return {
    blockingIssues,
    warnings,
    requiredPassed,
    requiredTotal: PUBLISH_REQUIRED_FIELD_LABELS.length,
  };
};

export const getCatalogPublishReadiness = (product: AdminCatalogProductSummary): PublishReadinessReport => {
  const blockingIssues: string[] = [];
  const warnings: string[] = [];
  let requiredPassed = 0;

  if (product.name.trim()) {
    requiredPassed += 1;
  } else {
    blockingIssues.push('Missing name');
  }

  if (product.brand.trim()) {
    requiredPassed += 1;
  } else {
    blockingIssues.push('Missing brand');
  }

  if (product.category.trim()) {
    requiredPassed += 1;
  } else {
    blockingIssues.push('Missing category');
  }

  if (product.price > 0) {
    requiredPassed += 1;
  } else {
    blockingIssues.push('Invalid price');
  }

  if (product.hasSizeMatrix) {
    requiredPassed += 1;
  } else {
    blockingIssues.push('Missing sizes');
  }

  if (product.hasMaterialProfile) {
    requiredPassed += 1;
  } else {
    blockingIssues.push('Missing materials');
  }

  if (product.hasShortBlurb) {
    requiredPassed += 1;
  } else {
    blockingIssues.push('Missing short blurb');
  }

  if (product.hasDescription) {
    requiredPassed += 1;
  } else {
    blockingIssues.push('Missing description');
  }

  if (product.hasHeroImage) {
    requiredPassed += 1;
  } else {
    blockingIssues.push('Missing hero image');
  }

  if (product.hasModel3d) {
    requiredPassed += 1;
  } else {
    blockingIssues.push('Missing 3D model');
  }

  if (product.stockStatus === 'Low stock') {
    warnings.push('Low stock inventory');
  }

  if (product.stockStatus === 'Waitlist') {
    warnings.push('Waitlist inventory state');
  }

  return {
    blockingIssues,
    warnings,
    requiredPassed,
    requiredTotal: PUBLISH_REQUIRED_FIELD_LABELS.length,
  };
};
