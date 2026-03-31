import * as React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ADMIN_ROUTE_PATHS } from '../app/adminRoutes';
import { adminCatalogEditorService } from '../shared/services';
import { AdminEmptyState, AdminLoadingState, AdminPageFrame } from '../shared/ui';
import type { AdminProductEditorDraft } from '../shared/types';
import { getEditorPublishReadiness, PUBLISH_REQUIRED_FIELD_LABELS, useAdminUnsavedChangesGuard } from '../shared/utils';

type ValidationErrors = Partial<Record<keyof AdminProductEditorDraft, string>>;
type MediaPreviewState = 'missing' | 'loading' | 'ready' | 'error';
type ModelViewerElement = HTMLElement;
type EditorNoticeTone = 'neutral' | 'success' | 'warning';
type CatalogEditorNavigationState = {
  catalogEditorNotice?: {
    message: string;
    tone: EditorNoticeTone;
  };
} | null;

const cloneDraft = (draft: AdminProductEditorDraft): AdminProductEditorDraft => ({
  ...draft,
  sizes: [...draft.sizes],
  materials: [...draft.materials],
});

const serializeDraft = (draft: AdminProductEditorDraft) =>
  JSON.stringify({
    ...draft,
    sizes: draft.sizes.map((size) => size.trim()).filter(Boolean),
    materials: draft.materials.map((material) => material.trim()).filter(Boolean),
  });

const parseCsvList = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const validateDraft = (draft: AdminProductEditorDraft): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (draft.name.trim().length < 3) {
    errors.name = 'Use at least 3 characters for product name.';
  }

  if (!draft.brand.trim()) {
    errors.brand = 'Brand is required.';
  }

  if (!draft.category.trim()) {
    errors.category = 'Category is required.';
  }

  if (!draft.colorway.trim()) {
    errors.colorway = 'Colorway label is required.';
  }

  if (draft.price <= 0) {
    errors.price = 'Price must be greater than zero.';
  }

  if (draft.compareAtPrice > 0 && draft.compareAtPrice < draft.price) {
    errors.compareAtPrice = 'Compare-at price should be equal to or higher than selling price.';
  }

  if (draft.quantityOnHand < 0) {
    errors.quantityOnHand = 'Inventory quantity cannot be negative.';
  }

  if (draft.sizes.length === 0) {
    errors.sizes = 'Add at least one size.';
  }

  if (draft.materials.length === 0) {
    errors.materials = 'Add at least one material.';
  }

  if (draft.shortBlurb.trim().length < 10) {
    errors.shortBlurb = 'Short blurb should be at least 10 characters.';
  }

  if (draft.description.trim().length < 40) {
    errors.description = 'Description should be at least 40 characters.';
  }

  if (!draft.image.trim()) {
    errors.image = 'Hero image URL is required.';
  } else if (!/^https?:\/\//i.test(draft.image.trim())) {
    errors.image = 'Hero image should use an absolute URL.';
  }

  if (!draft.modelUrl.trim()) {
    errors.modelUrl = '3D model URL is required.';
  } else if (!/^https?:\/\//i.test(draft.modelUrl.trim())) {
    errors.modelUrl = '3D model should use an absolute URL.';
  }

  return errors;
};

const shouldShowFieldError = (
  field: keyof AdminProductEditorDraft,
  touched: Partial<Record<keyof AdminProductEditorDraft, boolean>>,
  hasAttemptedSave: boolean,
  errors: ValidationErrors
) => Boolean(errors[field]) && (hasAttemptedSave || touched[field]);

const SectionShell: React.FC<{ id: string; title: string; summary: string; children: React.ReactNode }> = ({
  children,
  id,
  summary,
  title,
}) => (
  <section id={id} className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4 md:p-5">
    <header className="mb-4">
      <h3 className="text-lg font-black tracking-tight text-zinc-100">{title}</h3>
      <p className="mt-1 text-sm text-zinc-400">{summary}</p>
    </header>
    <div className="grid gap-4">{children}</div>
  </section>
);

const AdminCatalogEditorPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const [draft, setDraft] = React.useState<AdminProductEditorDraft | null>(null);
  const [initialDraft, setInitialDraft] = React.useState<AdminProductEditorDraft | null>(null);
  const [sizesInput, setSizesInput] = React.useState('');
  const [materialsInput, setMaterialsInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [saveMessage, setSaveMessage] = React.useState<string | null>(null);
  const [saveMessageTone, setSaveMessageTone] = React.useState<EditorNoticeTone>('neutral');
  const [hasAttemptedSave, setHasAttemptedSave] = React.useState(false);
  const [touched, setTouched] = React.useState<Partial<Record<keyof AdminProductEditorDraft, boolean>>>({});
  const [baselineSnapshot, setBaselineSnapshot] = React.useState('');
  const [heroPreviewState, setHeroPreviewState] = React.useState<MediaPreviewState>('missing');
  const [modelPreviewState, setModelPreviewState] = React.useState<MediaPreviewState>('missing');
  const modelViewerRef = React.useRef<ModelViewerElement | null>(null);

  const isEditMode = Boolean(productId);
  const validationErrors = React.useMemo(() => (draft ? validateDraft(draft) : {}), [draft]);
  const hasBlockingValidationErrors = Object.keys(validationErrors).length > 0;
  const isDirty = React.useMemo(
    () => (draft ? serializeDraft(draft) !== baselineSnapshot : false),
    [baselineSnapshot, draft]
  );
  const isPristineCreateDraft = !isEditMode && !isDirty && !hasAttemptedSave && (draft?.name.trim().length ?? 0) === 0;
  useAdminUnsavedChangesGuard(isDirty, 'You have unsaved product editor changes. Leave anyway?');
  const publishReadiness = React.useMemo(
    () =>
      draft
        ? getEditorPublishReadiness(draft, {
            heroPreviewFailed: heroPreviewState === 'error',
            modelPreviewFailed: modelPreviewState === 'error',
          })
        : { blockingIssues: [], warnings: [], requiredPassed: 0, requiredTotal: PUBLISH_REQUIRED_FIELD_LABELS.length },
    [draft, heroPreviewState, modelPreviewState]
  );
  const mediaWarnings = React.useMemo(
    () =>
      [...publishReadiness.blockingIssues, ...publishReadiness.warnings].filter((issue) => {
        const normalizedIssue = issue.toLowerCase();
        return normalizedIssue.includes('hero') || normalizedIssue.includes('3d model');
      }),
    [publishReadiness.blockingIssues, publishReadiness.warnings]
  );
  const lifecycleToneClassName = React.useMemo(() => {
    if (!draft) {
      return 'border-zinc-800 bg-zinc-950/60 text-zinc-200';
    }

    if (draft.publishState === 'Published') {
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100';
    }

    if (draft.publishState === 'Archived') {
      return 'border-zinc-700 bg-zinc-950/80 text-zinc-200';
    }

    return 'border-sky-500/30 bg-sky-500/10 text-sky-100';
  }, [draft]);
  const currentStateSummary = React.useMemo(() => {
    if (!draft) {
      return '';
    }

    if (draft.publishState === 'Published') {
      return 'This product is live on storefront routes backed by the shared catalog.';
    }

    if (draft.publishState === 'Archived') {
      return 'This product is preserved for reference and stays out of active storefront assortments.';
    }

    return 'Drafts stay off the storefront until you publish them.';
  }, [draft]);
  const currentStateActionGuidance = React.useMemo(() => {
    if (!draft) {
      return '';
    }

    if (draft.publishState === 'Published') {
      return 'Save changes keeps the current live record updated. Use Unpublish to remove storefront visibility without deleting the product.';
    }

    if (draft.publishState === 'Archived') {
      return 'Save changes keeps the archived record current. Use Publish if this product is ready to return to storefront surfaces.';
    }

    return 'Save draft at any point while the product is incomplete. Publish only becomes available after the required fields and media checks are ready.';
  }, [draft]);
  const saveActionLabel = !draft || draft.publishState === 'Draft' ? 'Save draft' : 'Save changes';

  const updateDraftField = <K extends keyof AdminProductEditorDraft>(field: K, value: AdminProductEditorDraft[K]) => {
    setDraft((currentDraft) => {
      if (!currentDraft) {
        return currentDraft;
      }
      return {
        ...currentDraft,
        [field]: value,
      };
    });
  };

  const markTouched = (field: keyof AdminProductEditorDraft) => {
    setTouched((currentTouched) => ({
      ...currentTouched,
      [field]: true,
    }));
  };

  React.useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setLoadError(null);
    setSaveMessage(null);
    setHasAttemptedSave(false);
    setTouched({});

    const loadDraft = async () => {
      try {
        const loadedDraft = isEditMode
          ? await adminCatalogEditorService.getProductDraft(productId ?? '')
          : adminCatalogEditorService.createEmptyDraft();

        if (!isMounted) {
          return;
        }

        if (!loadedDraft) {
          setDraft(null);
          setInitialDraft(null);
          setLoadError('Product could not be found for editing.');
          return;
        }

        const draftCopy = cloneDraft(loadedDraft);
        setDraft(draftCopy);
        setInitialDraft(cloneDraft(loadedDraft));
        setSizesInput(loadedDraft.sizes.join(', '));
        setMaterialsInput(loadedDraft.materials.join(', '));
        setBaselineSnapshot(serializeDraft(draftCopy));
      } catch {
        if (!isMounted) {
          return;
        }
        setDraft(null);
        setInitialDraft(null);
        setLoadError('Unable to load the product editor right now.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadDraft();

    return () => {
      isMounted = false;
    };
  }, [isEditMode, productId]);

  React.useEffect(() => {
    if (!draft) {
      setHeroPreviewState('missing');
      setModelPreviewState('missing');
      return;
    }

    setHeroPreviewState(draft.image.trim() ? 'loading' : 'missing');
    setModelPreviewState(draft.modelUrl.trim() ? 'loading' : 'missing');
  }, [draft?.image, draft?.modelUrl, draft]);

  React.useEffect(() => {
    if (!draft?.modelUrl.trim()) {
      return;
    }

    const modelViewer = modelViewerRef.current;
    if (!modelViewer) {
      return;
    }

    const handleModelLoad = () => {
      setModelPreviewState('ready');
    };

    const handleModelError = () => {
      setModelPreviewState('error');
    };

    modelViewer.addEventListener('load', handleModelLoad as EventListener);
    modelViewer.addEventListener('error', handleModelError as EventListener);

    return () => {
      modelViewer.removeEventListener('load', handleModelLoad as EventListener);
      modelViewer.removeEventListener('error', handleModelError as EventListener);
    };
  }, [draft?.modelUrl]);

  React.useEffect(() => {
    const navigationState = location.state as CatalogEditorNavigationState;
    const incomingNotice = navigationState?.catalogEditorNotice;

    if (!incomingNotice) {
      return;
    }

    setSaveMessage(incomingNotice.message);
    setSaveMessageTone(incomingNotice.tone);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const handleLeaveEditor = () => {
    if (isDirty && !window.confirm('You have unsaved changes. Leave editor anyway?')) {
      return;
    }
    navigate(ADMIN_ROUTE_PATHS.catalog);
  };

  const handleDiscardChanges = () => {
    if (!draft || !initialDraft) {
      return;
    }
    if (!isDirty) {
      return;
    }
    if (!window.confirm('Discard unsaved changes and restore the last loaded state?')) {
      return;
    }

    const restoredDraft = cloneDraft(initialDraft);
    setDraft(restoredDraft);
    setSizesInput(restoredDraft.sizes.join(', '));
    setMaterialsInput(restoredDraft.materials.join(', '));
    setBaselineSnapshot(serializeDraft(restoredDraft));
    setTouched({});
    setHasAttemptedSave(false);
    setSaveMessageTone('neutral');
    setSaveMessage('Unsaved changes were discarded.');
  };

  const handleSaveDraft = async () => {
    if (!draft) {
      return;
    }

    setHasAttemptedSave(true);

    setIsSaving(true);

    try {
      const result = await adminCatalogEditorService.saveDraft(draft);
      const savedDraft = cloneDraft(result.draft);
      setDraft(savedDraft);
      setInitialDraft(savedDraft);
      setSizesInput(savedDraft.sizes.join(', '));
      setMaterialsInput(savedDraft.materials.join(', '));
      setBaselineSnapshot(serializeDraft(savedDraft));
      setTouched({});
      setHasAttemptedSave(false);
      setSaveMessageTone('success');
      setSaveMessage(
        draft.publishState === 'Draft'
          ? `Draft saved at ${new Date(result.savedAt).toLocaleTimeString()}. It stays off the storefront until you publish it.`
          : `${draft.publishState} product changes saved at ${new Date(result.savedAt).toLocaleTimeString()}.`
      );
    } catch {
      setSaveMessageTone('warning');
      setSaveMessage('Unable to save draft right now. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!draft) {
      return;
    }

    setHasAttemptedSave(true);

    if (publishReadiness.blockingIssues.length > 0) {
      setSaveMessageTone('warning');
      setSaveMessage('Cannot publish. Resolve blocking publish-readiness issues first.');
      return;
    }

    const publishedDraft: AdminProductEditorDraft = { ...draft, publishState: 'Published' };
    setIsSaving(true);

    try {
      const result = await adminCatalogEditorService.publishDraft(publishedDraft);
      const savedDraft = cloneDraft(result.draft);
      setDraft(savedDraft);
      setInitialDraft(cloneDraft(savedDraft));
      setSizesInput(savedDraft.sizes.join(', '));
      setMaterialsInput(savedDraft.materials.join(', '));
      setBaselineSnapshot(serializeDraft(savedDraft));
      setTouched({});
      setHasAttemptedSave(false);
      setSaveMessageTone('success');
      setSaveMessage(
        `Product published at ${new Date(result.publishedAt).toLocaleTimeString()}. It is now visible on storefront routes that use published catalog records.`
      );
    } catch {
      setSaveMessageTone('warning');
      setSaveMessage('Unable to publish right now. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnpublish = async () => {
    if (!draft || draft.publishState !== 'Published') {
      return;
    }
    if (!window.confirm('Unpublish this product? It will move back to draft and disappear from storefront routes.')) {
      return;
    }

    const unpublishedDraft: AdminProductEditorDraft = { ...draft, publishState: 'Draft' };
    setIsSaving(true);

    try {
      const result = await adminCatalogEditorService.unpublishDraft(unpublishedDraft);
      const savedDraft = cloneDraft(result.draft);
      setDraft(savedDraft);
      setInitialDraft(cloneDraft(savedDraft));
      setSizesInput(savedDraft.sizes.join(', '));
      setMaterialsInput(savedDraft.materials.join(', '));
      setBaselineSnapshot(serializeDraft(savedDraft));
      setTouched({});
      setHasAttemptedSave(false);
      setSaveMessageTone('success');
      setSaveMessage(
        `Product moved back to draft at ${new Date(result.unpublishedAt).toLocaleTimeString()}. Storefront visibility has been removed.`
      );
    } catch {
      setSaveMessageTone('warning');
      setSaveMessage('Unable to unpublish right now. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const sectionStatuses = [
    {
      label: 'Basics',
      state:
        validationErrors.name || validationErrors.brand || validationErrors.category || validationErrors.colorway
          ? isPristineCreateDraft
            ? 'Not started'
            : 'Needs attention'
          : 'Ready',
    },
    {
      label: 'Pricing',
      state:
        validationErrors.price || validationErrors.compareAtPrice
          ? isPristineCreateDraft
            ? 'Not started'
            : 'Needs attention'
          : 'Ready',
    },
    {
      label: 'Inventory',
      state: validationErrors.quantityOnHand ? 'Needs attention' : 'Ready',
    },
    {
      label: 'Sizes',
      state: validationErrors.sizes ? (isPristineCreateDraft ? 'Not started' : 'Needs attention') : 'Ready',
    },
    {
      label: 'Materials',
      state: validationErrors.materials ? (isPristineCreateDraft ? 'Not started' : 'Needs attention') : 'Ready',
    },
    {
      label: 'Content',
      state:
        validationErrors.shortBlurb || validationErrors.description
          ? isPristineCreateDraft
            ? 'Not started'
            : 'Needs attention'
          : 'Ready',
    },
    {
      label: 'Media',
      state: mediaWarnings.length > 0 ? (isPristineCreateDraft ? 'Not started' : 'Needs attention') : 'Ready',
    },
    {
      label: 'Publishing',
      state:
        isPristineCreateDraft
          ? 'Draft setup'
          : publishReadiness.blockingIssues.length > 0
          ? 'Blocked'
          : publishReadiness.warnings.length > 0
            ? 'Caution'
            : 'Ready',
    },
  ];

  return (
    <AdminPageFrame
      eyebrow="Catalog Editor"
      title={isEditMode ? `Edit product ${productId}` : 'Create product draft'}
      summary="Use a structured owner workflow for product information, media, and publish-state preparation."
      actions={
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleLeaveEditor}
            className="rounded-full border border-zinc-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-200 transition hover:border-zinc-400"
          >
            Back to catalog
          </button>
          <button
            type="button"
            onClick={() => void handlePublish()}
            disabled={isSaving || !draft || draft.publishState === 'Published'}
            className="rounded-full border border-sky-500/60 bg-sky-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-sky-200 transition hover:border-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Publish
          </button>
          <button
            type="button"
            onClick={() => void handleUnpublish()}
            disabled={isSaving || !draft || draft.publishState !== 'Published'}
            className="rounded-full border border-zinc-600 bg-zinc-900/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-200 transition hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Unpublish
          </button>
          <button
            type="button"
            onClick={() => void handleSaveDraft()}
            disabled={isSaving}
            className="rounded-full border border-emerald-500/60 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200 transition hover:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? 'Saving...' : saveActionLabel}
          </button>
        </div>
      }
    >
      {isLoading ? (
        <AdminLoadingState label="Loading editor workspace..." />
      ) : loadError ? (
        <AdminEmptyState
          tone="error"
          title="Unable to load this product draft."
          description={loadError}
          actionLabel="Return to catalog"
          onAction={() => navigate(ADMIN_ROUTE_PATHS.catalog)}
        />
      ) : !draft ? (
        <AdminEmptyState
          title="Editor draft is unavailable."
          description="Reload the page or return to the catalog list."
          actionLabel="Return to catalog"
          onAction={() => navigate(ADMIN_ROUTE_PATHS.catalog)}
        />
      ) : (
        <div className="space-y-4">
          <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4 md:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-zinc-700 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-300">
                Mode: {isEditMode ? 'Edit' : 'Create'}
              </span>
              <span className="rounded-full border border-zinc-700 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-300">
                Draft ID: {draft.id}
              </span>
              <span
                className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${
                  isDirty
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                    : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                }`}
              >
                {isDirty ? 'Unsaved changes' : 'Saved state'}
              </span>
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-4">
              {sectionStatuses.map((section) => (
                <article key={section.label} className="rounded-2xl border border-zinc-800 bg-zinc-950/60 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">{section.label}</p>
                  <p className="mt-1 text-xs text-zinc-300">{section.state}</p>
                </article>
              ))}
            </div>
            {isPristineCreateDraft ? (
              <article className="mt-3 rounded-2xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
                New drafts start off-storefront. Save whenever you want, then publish once the required fields and media checks are complete.
              </article>
            ) : null}
            {saveMessage ? (
              <section
                role="status"
                aria-live="polite"
                className={`mt-3 rounded-2xl border px-4 py-3 text-sm ${
                  saveMessageTone === 'success'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                    : saveMessageTone === 'warning'
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                      : 'border-sky-500/30 bg-sky-500/10 text-sky-100'
                }`}
              >
                {saveMessage}
              </section>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDiscardChanges}
                disabled={!isDirty}
                className="rounded-full border border-zinc-700 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Discard changes
              </button>
            </div>
          </section>

          <SectionShell id="editor-basics" title="Basics" summary="Core product identity fields used across admin and storefront surfaces.">
            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
              Product name
              <input
                type="text"
                value={draft.name}
                onChange={(event) => updateDraftField('name', event.target.value)}
                onBlur={() => markTouched('name')}
                className="rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-100 outline-none transition focus:border-zinc-500"
              />
              {shouldShowFieldError('name', touched, hasAttemptedSave, validationErrors) ? (
                <span className="text-xs normal-case tracking-normal text-rose-300">{validationErrors.name}</span>
              ) : null}
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                Brand
                <input
                  type="text"
                  value={draft.brand}
                  onChange={(event) => updateDraftField('brand', event.target.value)}
                  onBlur={() => markTouched('brand')}
                  className="rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-100 outline-none transition focus:border-zinc-500"
                />
                {shouldShowFieldError('brand', touched, hasAttemptedSave, validationErrors) ? (
                  <span className="text-xs normal-case tracking-normal text-rose-300">{validationErrors.brand}</span>
                ) : null}
              </label>

              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                Category
                <input
                  type="text"
                  value={draft.category}
                  onChange={(event) => updateDraftField('category', event.target.value)}
                  onBlur={() => markTouched('category')}
                  className="rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-100 outline-none transition focus:border-zinc-500"
                />
                {shouldShowFieldError('category', touched, hasAttemptedSave, validationErrors) ? (
                  <span className="text-xs normal-case tracking-normal text-rose-300">{validationErrors.category}</span>
                ) : null}
              </label>
            </div>

            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
              Colorway
              <input
                type="text"
                value={draft.colorway}
                onChange={(event) => updateDraftField('colorway', event.target.value)}
                onBlur={() => markTouched('colorway')}
                className="rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-100 outline-none transition focus:border-zinc-500"
              />
              {shouldShowFieldError('colorway', touched, hasAttemptedSave, validationErrors) ? (
                <span className="text-xs normal-case tracking-normal text-rose-300">{validationErrors.colorway}</span>
              ) : null}
            </label>
          </SectionShell>

          <SectionShell id="editor-pricing" title="Pricing" summary="Commercial pricing inputs used for shelf price and comparison views.">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                Price (USD)
                <input
                  type="number"
                  min="0"
                  value={draft.price}
                  onChange={(event) => updateDraftField('price', Number(event.target.value || 0))}
                  onBlur={() => markTouched('price')}
                  className="rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-100 outline-none transition focus:border-zinc-500"
                />
                {shouldShowFieldError('price', touched, hasAttemptedSave, validationErrors) ? (
                  <span className="text-xs normal-case tracking-normal text-rose-300">{validationErrors.price}</span>
                ) : null}
              </label>

              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                Compare-at price
                <input
                  type="number"
                  min="0"
                  value={draft.compareAtPrice}
                  onChange={(event) => updateDraftField('compareAtPrice', Number(event.target.value || 0))}
                  onBlur={() => markTouched('compareAtPrice')}
                  className="rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-100 outline-none transition focus:border-zinc-500"
                />
                {shouldShowFieldError('compareAtPrice', touched, hasAttemptedSave, validationErrors) ? (
                  <span className="text-xs normal-case tracking-normal text-rose-300">
                    {validationErrors.compareAtPrice}
                  </span>
                ) : null}
              </label>
            </div>
          </SectionShell>

          <SectionShell id="editor-inventory" title="Inventory" summary="Operational stock and quantity fields for order planning and product availability.">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                Stock status
                <select
                  value={draft.stockStatus}
                  onChange={(event) => updateDraftField('stockStatus', event.target.value as AdminProductEditorDraft['stockStatus'])}
                  onBlur={() => markTouched('stockStatus')}
                  className="rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-100 outline-none transition focus:border-zinc-500"
                >
                  <option value="In stock">In stock</option>
                  <option value="Low stock">Low stock</option>
                  <option value="Waitlist">Waitlist</option>
                </select>
              </label>

              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                Quantity on hand
                <input
                  type="number"
                  min="0"
                  value={draft.quantityOnHand}
                  onChange={(event) => updateDraftField('quantityOnHand', Number(event.target.value || 0))}
                  onBlur={() => markTouched('quantityOnHand')}
                  className="rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-100 outline-none transition focus:border-zinc-500"
                />
                {shouldShowFieldError('quantityOnHand', touched, hasAttemptedSave, validationErrors) ? (
                  <span className="text-xs normal-case tracking-normal text-rose-300">
                    {validationErrors.quantityOnHand}
                  </span>
                ) : null}
              </label>
            </div>
          </SectionShell>

          <SectionShell id="editor-sizes" title="Sizes" summary="Comma-separated size matrix used by storefront selection controls.">
            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
              Available sizes
              <input
                type="text"
                value={sizesInput}
                onChange={(event) => {
                  const value = event.target.value;
                  setSizesInput(value);
                  updateDraftField('sizes', parseCsvList(value));
                }}
                onBlur={() => markTouched('sizes')}
                placeholder="US 7, US 8, US 9"
                className="rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-100 outline-none transition focus:border-zinc-500"
              />
              {shouldShowFieldError('sizes', touched, hasAttemptedSave, validationErrors) ? (
                <span className="text-xs normal-case tracking-normal text-rose-300">{validationErrors.sizes}</span>
              ) : null}
            </label>
            <div className="flex flex-wrap gap-2">
              {draft.sizes.map((size) => (
                <span key={size} className="rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1 text-xs text-zinc-300">
                  {size}
                </span>
              ))}
            </div>
          </SectionShell>

          <SectionShell id="editor-materials" title="Materials" summary="Comma-separated materials list shown in product detail storytelling.">
            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
              Material stack
              <input
                type="text"
                value={materialsInput}
                onChange={(event) => {
                  const value = event.target.value;
                  setMaterialsInput(value);
                  updateDraftField('materials', parseCsvList(value));
                }}
                onBlur={() => markTouched('materials')}
                placeholder="Prime-knit upper, Carbon plate"
                className="rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-100 outline-none transition focus:border-zinc-500"
              />
              {shouldShowFieldError('materials', touched, hasAttemptedSave, validationErrors) ? (
                <span className="text-xs normal-case tracking-normal text-rose-300">{validationErrors.materials}</span>
              ) : null}
            </label>
            <div className="flex flex-wrap gap-2">
              {draft.materials.map((material) => (
                <span
                  key={material}
                  className="rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1 text-xs text-zinc-300"
                >
                  {material}
                </span>
              ))}
            </div>
          </SectionShell>

          <SectionShell id="editor-content" title="Content" summary="Owner-authored copy for compact previews and full product narrative.">
            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
              Short blurb
              <textarea
                rows={2}
                value={draft.shortBlurb}
                onChange={(event) => updateDraftField('shortBlurb', event.target.value)}
                onBlur={() => markTouched('shortBlurb')}
                className="rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-100 outline-none transition focus:border-zinc-500"
              />
              {shouldShowFieldError('shortBlurb', touched, hasAttemptedSave, validationErrors) ? (
                <span className="text-xs normal-case tracking-normal text-rose-300">{validationErrors.shortBlurb}</span>
              ) : null}
            </label>

            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
              Description
              <textarea
                rows={5}
                value={draft.description}
                onChange={(event) => updateDraftField('description', event.target.value)}
                onBlur={() => markTouched('description')}
                className="rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-100 outline-none transition focus:border-zinc-500"
              />
              {shouldShowFieldError('description', touched, hasAttemptedSave, validationErrors) ? (
                <span className="text-xs normal-case tracking-normal text-rose-300">{validationErrors.description}</span>
              ) : null}
            </label>
          </SectionShell>

          <SectionShell
            id="editor-media"
            title="Media"
            summary="Hero and model source URLs feeding image and immersive product rendering surfaces."
          >
            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
              Hero image URL
              <input
                type="url"
                value={draft.image}
                onChange={(event) => updateDraftField('image', event.target.value)}
                onBlur={() => markTouched('image')}
                className="rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-100 outline-none transition focus:border-zinc-500"
              />
              {shouldShowFieldError('image', touched, hasAttemptedSave, validationErrors) ? (
                <span className="text-xs normal-case tracking-normal text-rose-300">{validationErrors.image}</span>
              ) : null}
            </label>

            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
              3D model URL
              <input
                type="url"
                value={draft.modelUrl}
                onChange={(event) => updateDraftField('modelUrl', event.target.value)}
                onBlur={() => markTouched('modelUrl')}
                className="rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-100 outline-none transition focus:border-zinc-500"
              />
              {shouldShowFieldError('modelUrl', touched, hasAttemptedSave, validationErrors) ? (
                <span className="text-xs normal-case tracking-normal text-rose-300">{validationErrors.modelUrl}</span>
              ) : null}
            </label>

            <div className="grid gap-4 xl:grid-cols-2">
              <article className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Hero Image Preview</p>
                <div className="relative mt-3 h-64 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
                  {!draft.image.trim() ? (
                    <div className="flex h-full items-center justify-center px-5 text-center text-sm text-zinc-500">
                      Add a hero image URL to preview customer-facing visuals.
                    </div>
                  ) : (
                    <>
                      <img
                        key={draft.image}
                        src={draft.image}
                        alt={draft.name ? `${draft.name} hero preview` : 'Hero preview'}
                        className="h-full w-full object-cover"
                        onLoad={() => setHeroPreviewState('ready')}
                        onError={() => setHeroPreviewState('error')}
                      />
                      {heroPreviewState === 'loading' ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/65 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-300">
                          Loading image
                        </div>
                      ) : null}
                      {heroPreviewState === 'error' ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-rose-950/70 px-5 text-center text-sm text-rose-200">
                          Hero image failed to load. Customers may see broken media.
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              </article>

              <article className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">3D Model Preview</p>
                <div className="relative mt-3 h-64 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
                  {!draft.modelUrl.trim() ? (
                    <div className="flex h-full items-center justify-center px-5 text-center text-sm text-zinc-500">
                      Add a 3D model URL to preview immersive storefront behavior.
                    </div>
                  ) : (
                    <>
                      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.18),transparent_45%),radial-gradient(circle_at_70%_75%,rgba(14,165,233,0.14),transparent_50%)]" />
                      <model-viewer
                        key={draft.modelUrl}
                        ref={(node: HTMLElement | null) => {
                          modelViewerRef.current = node as ModelViewerElement | null;
                        }}
                        src={draft.modelUrl}
                        poster={draft.image || undefined}
                        camera-controls
                        auto-rotate
                        rotation-per-second="26deg"
                        interaction-prompt="none"
                        touch-action="pan-y"
                        loading="eager"
                        onLoad={() => setModelPreviewState('ready')}
                        onError={() => setModelPreviewState('error')}
                        className="relative z-10 h-full w-full"
                      />
                      {modelPreviewState === 'loading' ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/65 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-300">
                          Loading 3D preview
                        </div>
                      ) : null}
                      {modelPreviewState === 'error' ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-rose-950/70 px-5 text-center text-sm text-rose-200">
                          3D preview failed to load. Customers may lose immersive view.
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              </article>
            </div>

            <article className="rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Storefront Preview Lens</p>
              <p className="mt-2 text-sm text-zinc-300">
                {draft.name || 'Untitled product'} {draft.colorway ? `(${draft.colorway})` : ''} will be shown with
                hero media and interactive model surfaces on customer-facing product views.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-400">
                <span className="rounded-full border border-zinc-700 px-3 py-1">
                  Hero: {heroPreviewState === 'ready' ? 'Ready' : heroPreviewState}
                </span>
                <span className="rounded-full border border-zinc-700 px-3 py-1">
                  3D: {modelPreviewState === 'ready' ? 'Ready' : modelPreviewState}
                </span>
              </div>
            </article>
          </SectionShell>

          <SectionShell
            id="editor-publishing"
            title="Publishing"
            summary="Track lifecycle state, publish checklist, and storefront visibility before changing product state."
          >
            <article className={`rounded-2xl border px-4 py-3 ${lifecycleToneClassName}`}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Current state</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-current/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
                  {draft.publishState}
                </span>
                <p className="text-sm">{currentStateSummary}</p>
              </div>
              <p className="mt-3 text-sm text-zinc-300">{currentStateActionGuidance}</p>
            </article>

            <article className="rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Draft validation</p>
              <p className="mt-2 text-sm text-zinc-300">
                {hasBlockingValidationErrors
                  ? 'This draft has unresolved field-level validation issues.'
                  : 'No blocking validation issues detected for current draft data.'}
              </p>
            </article>

            <article className="rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Publish checklist</p>
              <p className="mt-2 text-sm text-zinc-300">
                Required fields completed: {publishReadiness.requiredPassed}/{publishReadiness.requiredTotal}
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-400">
                {PUBLISH_REQUIRED_FIELD_LABELS.map((label) => (
                  <li key={label}>{label}</li>
                ))}
              </ul>
            </article>

            <article className="rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Blocking checks</p>
              {publishReadiness.blockingIssues.length === 0 ? (
                <p className="mt-2 text-sm text-emerald-300">No blocking issues detected for publish.</p>
              ) : (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-rose-300">
                  {publishReadiness.blockingIssues.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              )}
            </article>

            <article className="rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Non-blocking warnings</p>
              {publishReadiness.warnings.length === 0 ? (
                <p className="mt-2 text-sm text-emerald-300">No extra quality warnings right now.</p>
              ) : (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-200">
                  {publishReadiness.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              )}
            </article>

            <article className="rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Media readiness</p>
              {mediaWarnings.length === 0 ? (
                <p className="mt-2 text-sm text-emerald-300">Hero and 3D assets look publish-ready for storefront.</p>
              ) : (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-200">
                  {mediaWarnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              )}
              {draft.publishState === 'Published' && publishReadiness.blockingIssues.length > 0 ? (
                <p className="mt-3 text-sm text-rose-300">
                  This product is marked Published while blocking publish-readiness issues exist.
                </p>
              ) : null}
            </article>
          </SectionShell>
        </div>
      )}
    </AdminPageFrame>
  );
};

export default AdminCatalogEditorPage;
