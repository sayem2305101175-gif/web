import * as React from 'react';
import { adminContentService } from '../shared/services';
import { AdminEmptyState, AdminLoadingState, AdminPageFrame } from '../shared/ui';
import type { AdminContentSection, AdminFeaturedProductOption } from '../shared/types';
import type { StorefrontContentSnapshot } from '../../../content/storefront';
import { useAdminUnsavedChangesGuard } from '../shared/utils';

type ValidationSeverity = 'blocking' | 'warning';

interface ValidationIssue {
  id: string;
  message: string;
  severity: ValidationSeverity;
}

const cloneSnapshot = (snapshot: StorefrontContentSnapshot): StorefrontContentSnapshot => ({
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

const serializeSnapshot = (snapshot: StorefrontContentSnapshot) =>
  JSON.stringify({
    ...snapshot,
    hero: {
      ...snapshot.hero,
      stripText: snapshot.hero.stripText.trim(),
      eyebrow: snapshot.hero.eyebrow.trim(),
      headline: snapshot.hero.headline.trim(),
      description: snapshot.hero.description.trim(),
      primaryCtaLabel: snapshot.hero.primaryCtaLabel.trim(),
      secondaryCtaLabel: snapshot.hero.secondaryCtaLabel.trim(),
    },
    featuredDrop: {
      ...snapshot.featuredDrop,
      productId: snapshot.featuredDrop.productId.trim(),
      fallbackName: snapshot.featuredDrop.fallbackName.trim(),
      fallbackBody: snapshot.featuredDrop.fallbackBody.trim(),
      actionLabel: snapshot.featuredDrop.actionLabel.trim(),
    },
    trust: {
      ...snapshot.trust,
      eyebrow: snapshot.trust.eyebrow.trim(),
      headline: snapshot.trust.headline.trim(),
      items: snapshot.trust.items.map((item) => ({
        eyebrow: item.eyebrow.trim(),
        title: item.title.trim(),
        body: item.body.trim(),
      })),
    },
    faq: {
      ...snapshot.faq,
      eyebrow: snapshot.faq.eyebrow.trim(),
      headline: snapshot.faq.headline.trim(),
      items: snapshot.faq.items.map((item) => ({
        question: item.question.trim(),
        answer: item.answer.trim(),
      })),
    },
    cta: {
      ...snapshot.cta,
      eyebrow: snapshot.cta.eyebrow.trim(),
      headline: snapshot.cta.headline.trim(),
      buttonLabel: snapshot.cta.buttonLabel.trim(),
      chips: snapshot.cta.chips.map((chip) => chip.trim()),
    },
    shipping: {
      ...snapshot.shipping,
      title: snapshot.shipping.title.trim(),
      message: snapshot.shipping.message.trim(),
    },
    returns: {
      ...snapshot.returns,
      title: snapshot.returns.title.trim(),
      message: snapshot.returns.message.trim(),
    },
  });

const validateDraft = (
  draft: StorefrontContentSnapshot,
  products: AdminFeaturedProductOption[]
): { blocking: ValidationIssue[]; warnings: ValidationIssue[] } => {
  const blocking: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const productIds = new Set(products.map((product) => product.id));
  const selectedProduct = products.find((product) => product.id === draft.featuredDrop.productId);

  if (draft.hero.stripText.trim().length < 20) {
    blocking.push({
      id: 'hero-strip',
      message: 'Hero strip text should be at least 20 characters.',
      severity: 'blocking',
    });
  }
  if (draft.hero.headline.trim().length < 24) {
    blocking.push({
      id: 'hero-headline',
      message: 'Hero headline should be at least 24 characters.',
      severity: 'blocking',
    });
  }
  if (draft.hero.description.trim().length < 40) {
    blocking.push({
      id: 'hero-description',
      message: 'Hero description should be at least 40 characters.',
      severity: 'blocking',
    });
  }
  if (!draft.hero.primaryCtaLabel.trim() || !draft.hero.secondaryCtaLabel.trim()) {
    blocking.push({
      id: 'hero-cta-labels',
      message: 'Hero primary and secondary CTA labels are required.',
      severity: 'blocking',
    });
  }

  if (!draft.featuredDrop.productId.trim()) {
    blocking.push({
      id: 'featured-product-required',
      message: 'Featured drop must be linked to a catalog product.',
      severity: 'blocking',
    });
  } else if (!productIds.has(draft.featuredDrop.productId.trim())) {
    blocking.push({
      id: 'featured-product-invalid',
      message: 'Selected featured drop product is not available in the catalog list.',
      severity: 'blocking',
    });
  }

  if (!draft.featuredDrop.actionLabel.trim()) {
    blocking.push({
      id: 'featured-action-label',
      message: 'Featured drop action label is required.',
      severity: 'blocking',
    });
  }

  if (draft.trust.items.length !== 3) {
    blocking.push({
      id: 'trust-count',
      message: 'Trust content must contain exactly 3 cards.',
      severity: 'blocking',
    });
  }

  draft.trust.items.forEach((item, index) => {
    if (!item.title.trim()) {
      blocking.push({
        id: `trust-title-${index}`,
        message: `Trust card ${index + 1} title is required.`,
        severity: 'blocking',
      });
    }
    if (item.body.trim().length < 24) {
      blocking.push({
        id: `trust-body-${index}`,
        message: `Trust card ${index + 1} body should be at least 24 characters.`,
        severity: 'blocking',
      });
    }
  });

  if (draft.faq.items.length !== 4) {
    blocking.push({
      id: 'faq-count',
      message: 'FAQ must contain exactly 4 items for the storefront layout.',
      severity: 'blocking',
    });
  }

  draft.faq.items.forEach((item, index) => {
    if (item.question.trim().length < 8) {
      blocking.push({
        id: `faq-question-${index}`,
        message: `FAQ item ${index + 1} question should be at least 8 characters.`,
        severity: 'blocking',
      });
    }
    if (item.answer.trim().length < 24) {
      blocking.push({
        id: `faq-answer-${index}`,
        message: `FAQ item ${index + 1} answer should be at least 24 characters.`,
        severity: 'blocking',
      });
    }
  });

  if (draft.cta.chips.length !== 5) {
    blocking.push({
      id: 'cta-chip-count',
      message: 'CTA chip row should contain exactly 5 labels.',
      severity: 'blocking',
    });
  }

  draft.cta.chips.forEach((chip, index) => {
    if (!chip.trim()) {
      blocking.push({
        id: `cta-chip-${index}`,
        message: `CTA chip ${index + 1} cannot be empty.`,
        severity: 'blocking',
      });
    }
  });

  if (!draft.shipping.title.trim() || draft.shipping.message.trim().length < 20) {
    blocking.push({
      id: 'shipping-message',
      message: 'Shipping title and detailed message are required.',
      severity: 'blocking',
    });
  }

  if (!draft.returns.title.trim() || draft.returns.message.trim().length < 20) {
    blocking.push({
      id: 'returns-message',
      message: 'Returns title and detailed message are required.',
      severity: 'blocking',
    });
  }

  if (selectedProduct && selectedProduct.publishState !== 'Published') {
    warnings.push({
      id: 'featured-unpublished',
      message: `Featured product "${selectedProduct.name}" is currently ${selectedProduct.publishState}.`,
      severity: 'warning',
    });
  }

  if (selectedProduct && selectedProduct.stockStatus === 'Waitlist') {
    warnings.push({
      id: 'featured-waitlist',
      message: `Featured product "${selectedProduct.name}" is currently on waitlist stock status.`,
      severity: 'warning',
    });
  }

  if (draft.hero.stripText.trim().length > 110) {
    warnings.push({
      id: 'hero-strip-length',
      message: 'Hero strip text is long and may wrap on smaller screens.',
      severity: 'warning',
    });
  }

  return { blocking, warnings };
};

const resolvePublishStateClassName = (publishState: AdminFeaturedProductOption['publishState']) => {
  if (publishState === 'Published') {
    return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200';
  }
  if (publishState === 'Archived') {
    return 'border-zinc-600/50 bg-zinc-800 text-zinc-300';
  }
  return 'border-sky-500/40 bg-sky-500/10 text-sky-200';
};

const SectionShell: React.FC<{ title: string; summary: string; children: React.ReactNode }> = ({
  children,
  summary,
  title,
}) => (
  <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4 md:p-5">
    <header>
      <h3 className="text-lg font-black tracking-tight text-zinc-100">{title}</h3>
      <p className="mt-1 text-sm text-zinc-400">{summary}</p>
    </header>
    <div className="mt-4 space-y-4">{children}</div>
  </section>
);

const AdminContentPage: React.FC = () => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [sections, setSections] = React.useState<AdminContentSection[]>([]);
  const [featuredProducts, setFeaturedProducts] = React.useState<AdminFeaturedProductOption[]>([]);
  const [draft, setDraft] = React.useState<StorefrontContentSnapshot | null>(null);
  const [baselineSnapshot, setBaselineSnapshot] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveMessage, setSaveMessage] = React.useState<string | null>(null);
  const [saveMessageTone, setSaveMessageTone] = React.useState<'neutral' | 'success' | 'warning'>('neutral');
  const [hasAttemptedSave, setHasAttemptedSave] = React.useState(false);

  const loadFeaturedProducts = React.useCallback(async () => adminContentService.listFeaturedProducts(), []);

  const loadContentWorkspace = React.useCallback(async () => {
    const [loadedSections, loadedContent, loadedProducts] = await Promise.all([
      adminContentService.listSections(),
      adminContentService.getStorefrontContent(),
      loadFeaturedProducts(),
    ]);

    return {
      content: loadedContent,
      products: loadedProducts,
      sections: loadedSections,
    };
  }, [loadFeaturedProducts]);

  React.useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setLoadError(null);

    const loadData = async () => {
      try {
        const { content: loadedContent, products: loadedProducts, sections: loadedSections } =
          await loadContentWorkspace();

        if (!isMounted) {
          return;
        }

        const draftCopy = cloneSnapshot(loadedContent);
        setSections(loadedSections);
        setFeaturedProducts(loadedProducts);
        setDraft(draftCopy);
        setBaselineSnapshot(serializeSnapshot(draftCopy));
      } catch {
        if (!isMounted) {
          return;
        }
        setLoadError('Content modules could not be loaded. Please reload the page.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [loadContentWorkspace]);

  const validation = React.useMemo(
    () => (draft ? validateDraft(draft, featuredProducts) : { blocking: [], warnings: [] }),
    [draft, featuredProducts]
  );
  const isDirty = React.useMemo(
    () => (draft ? serializeSnapshot(draft) !== baselineSnapshot : false),
    [baselineSnapshot, draft]
  );
  useAdminUnsavedChangesGuard(isDirty, 'You have unsaved storefront content changes. Leave anyway?');
  const selectedFeaturedProduct = React.useMemo(
    () => featuredProducts.find((product) => product.id === draft?.featuredDrop.productId) ?? null,
    [draft?.featuredDrop.productId, featuredProducts]
  );
  const selectedFeaturedProductMissing =
    Boolean(draft?.featuredDrop.productId.trim()) && !selectedFeaturedProduct;

  React.useEffect(() => {
    let isActive = true;

    const unsubscribe = adminContentService.subscribe(() => {
      void loadFeaturedProducts()
        .then((products) => {
          if (!isActive) {
            return;
          }
          setFeaturedProducts(products);
        })
        .catch(() => undefined);

      if (isDirty) {
        return;
      }

      void Promise.all([adminContentService.listSections(), adminContentService.getStorefrontContent()])
        .then(([loadedSections, loadedContent]) => {
          if (!isActive) {
            return;
          }

          const refreshedDraft = cloneSnapshot(loadedContent);
          setSections(loadedSections);
          setDraft(refreshedDraft);
          setBaselineSnapshot(serializeSnapshot(refreshedDraft));
        })
        .catch(() => undefined);
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [isDirty, loadFeaturedProducts]);

  const updateDraft = (updater: (current: StorefrontContentSnapshot) => StorefrontContentSnapshot) => {
    setDraft((current) => {
      if (!current) {
        return current;
      }
      return updater(current);
    });
  };

  const handleSave = async () => {
    if (!draft) {
      return;
    }

    setHasAttemptedSave(true);
    let latestFeaturedProducts = featuredProducts;
    try {
      latestFeaturedProducts = await adminContentService.listFeaturedProducts();
      setFeaturedProducts(latestFeaturedProducts);
    } catch {
      // Keep current list when refresh fails and continue with latest known catalog truth.
    }

    const latestValidation = validateDraft(draft, latestFeaturedProducts);
    if (latestValidation.blocking.length > 0) {
      setSaveMessageTone('warning');
      setSaveMessage('Cannot save storefront content while blocking validation issues are unresolved.');
      return;
    }

    setIsSaving(true);

    try {
      const result = await adminContentService.saveStorefrontContent(draft);
      const savedDraft = cloneSnapshot(result.snapshot);
      const featuredStateWarning = latestValidation.warnings.find((issue) => issue.id === 'featured-unpublished');
      setDraft(savedDraft);
      setBaselineSnapshot(serializeSnapshot(savedDraft));
      setHasAttemptedSave(false);
      setSaveMessageTone(featuredStateWarning ? 'warning' : 'success');
      setSaveMessage(
        `Storefront content saved at ${new Date(result.savedAt).toLocaleTimeString()}.${
          featuredStateWarning ? ` Warning: ${featuredStateWarning.message}` : ''
        }`
      );
      setSections((currentSections) =>
        currentSections.map((section) => ({
          ...section,
          lastUpdatedAt: result.savedAt,
        }))
      );
    } catch {
      setSaveMessageTone('warning');
      setSaveMessage('Save failed. Please retry after checking your content fields.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    if (!draft || !isDirty) {
      return;
    }
    if (!window.confirm('Discard all unsaved storefront content changes?')) {
      return;
    }

    void adminContentService
      .getStorefrontContent()
      .then((latest) => {
        const restored = cloneSnapshot(latest);
        setDraft(restored);
        setBaselineSnapshot(serializeSnapshot(restored));
        setSaveMessageTone('neutral');
        setSaveMessage('Unsaved content changes were discarded.');
        setHasAttemptedSave(false);
      })
      .catch(() => {
        setSaveMessageTone('warning');
        setSaveMessage('Unable to discard changes right now. Try reloading the page.');
      });
  };

  return (
    <AdminPageFrame
      eyebrow="Content"
      title="Storefront messaging"
      summary="Control hero language, feature storytelling, trust content, and route-level communication surfaces."
      actions={
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleDiscardChanges}
            disabled={!isDirty || isSaving}
            className="rounded-full border border-zinc-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-200 transition hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Discard changes
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving || !draft}
            className="rounded-full border border-emerald-500/60 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200 transition hover:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? 'Saving...' : 'Save content'}
          </button>
        </div>
      }
    >
      {isLoading ? (
        <AdminLoadingState label="Loading content modules..." />
      ) : loadError ? (
        <AdminEmptyState tone="error" title="Content workspace unavailable." description={loadError} />
      ) : sections.length === 0 ? (
        <AdminEmptyState
          title="No content modules configured yet."
          description="Step 8 will add scoped editing controls for hero, featured drop, trust blocks, FAQ, CTA, shipping, and returns messaging."
        />
      ) : !draft ? (
        <AdminEmptyState
          title="Storefront content draft unavailable."
          description="Reload the page to restore storefront content modules."
        />
      ) : (
        <div className="space-y-4">
          <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4 md:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                  isDirty
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                    : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                }`}
              >
                {isDirty ? 'Unsaved changes' : 'Saved state'}
              </span>
              <span className="rounded-full border border-zinc-700 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-300">
                Blocking issues: {validation.blocking.length}
              </span>
              <span className="rounded-full border border-zinc-700 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-300">
                Warnings: {validation.warnings.length}
              </span>
              <span className="rounded-full border border-zinc-700 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-300">
                Last saved: {draft.updatedAt ? new Date(draft.updatedAt).toLocaleString() : 'Never'}
              </span>
            </div>

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

            {(hasAttemptedSave || validation.blocking.length > 0 || validation.warnings.length > 0) &&
            validation.blocking.length + validation.warnings.length > 0 ? (
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <article className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-200">Blocking</p>
                  {validation.blocking.length === 0 ? (
                    <p className="mt-2 text-sm text-rose-100">No blocking issues.</p>
                  ) : (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-rose-100">
                      {validation.blocking.map((issue) => (
                        <li key={issue.id}>{issue.message}</li>
                      ))}
                    </ul>
                  )}
                </article>
                <article className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">Warnings</p>
                  {validation.warnings.length === 0 ? (
                    <p className="mt-2 text-sm text-amber-100">No warnings.</p>
                  ) : (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-100">
                      {validation.warnings.map((issue) => (
                        <li key={issue.id}>{issue.message}</li>
                      ))}
                    </ul>
                  )}
                </article>
              </div>
            ) : null}
          </section>

          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {sections.map((section) => (
              <article key={section.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">{section.name}</p>
                <p className="mt-2 text-xs text-zinc-400">{section.description}</p>
                <p className="mt-3 text-[11px] text-zinc-500">
                  Updated: {section.lastUpdatedAt ? new Date(section.lastUpdatedAt).toLocaleString() : 'Not yet saved'}
                </p>
              </article>
            ))}
          </section>

          <SectionShell
            title="Hero Messaging"
            summary="Scope: top-strip message plus hero copy and button labels. This controls only the storefront hero region."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                Strip text
                <input
                  type="text"
                  value={draft.hero.stripText}
                  onChange={(event) =>
                    updateDraft((current) => ({
                      ...current,
                      hero: {
                        ...current.hero,
                        stripText: event.target.value,
                      },
                    }))
                  }
                  className="rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-100 outline-none transition focus:border-zinc-500"
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                Eyebrow
                <input
                  type="text"
                  value={draft.hero.eyebrow}
                  onChange={(event) =>
                    updateDraft((current) => ({
                      ...current,
                      hero: {
                        ...current.hero,
                        eyebrow: event.target.value,
                      },
                    }))
                  }
                  className="rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-100 outline-none transition focus:border-zinc-500"
                />
              </label>
            </div>

            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
              Headline
              <input
                type="text"
                value={draft.hero.headline}
                onChange={(event) =>
                  updateDraft((current) => ({
                    ...current,
                    hero: {
                      ...current.hero,
                      headline: event.target.value,
                    },
                  }))
                }
                className="rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-100 outline-none transition focus:border-zinc-500"
              />
            </label>

            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
              Description
              <textarea
                rows={3}
                value={draft.hero.description}
                onChange={(event) =>
                  updateDraft((current) => ({
                    ...current,
                    hero: {
                      ...current.hero,
                      description: event.target.value,
                    },
                  }))
                }
                className="rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-100 outline-none transition focus:border-zinc-500"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                Primary CTA label
                <input
                  type="text"
                  value={draft.hero.primaryCtaLabel}
                  onChange={(event) =>
                    updateDraft((current) => ({
                      ...current,
                      hero: {
                        ...current.hero,
                        primaryCtaLabel: event.target.value,
                      },
                    }))
                  }
                  className="rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-100 outline-none transition focus:border-zinc-500"
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                Secondary CTA label
                <input
                  type="text"
                  value={draft.hero.secondaryCtaLabel}
                  onChange={(event) =>
                    updateDraft((current) => ({
                      ...current,
                      hero: {
                        ...current.hero,
                        secondaryCtaLabel: event.target.value,
                      },
                    }))
                  }
                  className="rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-100 outline-none transition focus:border-zinc-500"
                />
              </label>
            </div>

            <article className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Hero preview</p>
              <p className="mt-3 text-[11px] font-black uppercase tracking-[0.28em] text-zinc-400">{draft.hero.stripText}</p>
              <p className="mt-4 text-[10px] font-black uppercase tracking-[0.36em] text-zinc-500">{draft.hero.eyebrow}</p>
              <h4 className="mt-2 text-2xl font-black tracking-tight text-zinc-100">{draft.hero.headline}</h4>
              <p className="mt-2 text-sm text-zinc-400">{draft.hero.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-200">
                  {draft.hero.primaryCtaLabel}
                </span>
                <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-200">
                  {draft.hero.secondaryCtaLabel}
                </span>
              </div>
            </article>
          </SectionShell>

          <SectionShell
            title="Featured Drop"
            summary="Scope: one catalog-linked product spotlight shown in the home hero. Product selection is restricted to real catalog entries."
          >
            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
              Featured product
              <select
                value={draft.featuredDrop.productId}
                onChange={(event) =>
                  updateDraft((current) => ({
                    ...current,
                    featuredDrop: {
                      ...current.featuredDrop,
                      productId: event.target.value,
                    },
                  }))
                }
                className="rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-100 outline-none transition focus:border-zinc-500"
              >
                <option value="">Select product</option>
                {featuredProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} · {product.brand} (#{product.id})
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                Fallback name
                <input
                  type="text"
                  value={draft.featuredDrop.fallbackName}
                  onChange={(event) =>
                    updateDraft((current) => ({
                      ...current,
                      featuredDrop: {
                        ...current.featuredDrop,
                        fallbackName: event.target.value,
                      },
                    }))
                  }
                  className="rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-100 outline-none transition focus:border-zinc-500"
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                Action label
                <input
                  type="text"
                  value={draft.featuredDrop.actionLabel}
                  onChange={(event) =>
                    updateDraft((current) => ({
                      ...current,
                      featuredDrop: {
                        ...current.featuredDrop,
                        actionLabel: event.target.value,
                      },
                    }))
                  }
                  className="rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-100 outline-none transition focus:border-zinc-500"
                />
              </label>
            </div>

            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
              Fallback body
              <textarea
                rows={3}
                value={draft.featuredDrop.fallbackBody}
                onChange={(event) =>
                  updateDraft((current) => ({
                    ...current,
                    featuredDrop: {
                      ...current.featuredDrop,
                      fallbackBody: event.target.value,
                    },
                  }))
                }
                className="rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-100 outline-none transition focus:border-zinc-500"
              />
            </label>

            <article className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Featured drop preview</p>
              {selectedFeaturedProduct ? (
                <div className="mt-3 space-y-2">
                  <h4 className="text-xl font-black tracking-tight text-zinc-100">{selectedFeaturedProduct.name}</h4>
                  <p className="text-sm text-zinc-400">{selectedFeaturedProduct.brand}</p>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${resolvePublishStateClassName(selectedFeaturedProduct.publishState)}`}
                    >
                      {selectedFeaturedProduct.publishState}
                    </span>
                    <span className="rounded-full border border-zinc-700 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-300">
                      {selectedFeaturedProduct.stockStatus}
                    </span>
                  </div>
                  {selectedFeaturedProduct.publishState !== 'Published' ? (
                    <p className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                      Storefront hero will use fallback name and body until this product is published.
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="mt-3 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3">
                  <h4 className="text-lg font-black tracking-tight text-zinc-100">{draft.featuredDrop.fallbackName}</h4>
                  <p className="mt-2 text-sm text-zinc-400">{draft.featuredDrop.fallbackBody}</p>
                </div>
              )}
              {selectedFeaturedProductMissing ? (
                <p className="mt-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                  The selected featured product is no longer in the catalog. Choose another product before saving.
                </p>
              ) : null}
            </article>
          </SectionShell>

          <SectionShell
            title="Trust Content"
            summary="Scope: trust section headline plus exactly 3 promise cards to keep storefront structure intentional and stable."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                Section eyebrow
                <input
                  type="text"
                  value={draft.trust.eyebrow}
                  onChange={(event) =>
                    updateDraft((current) => ({
                      ...current,
                      trust: {
                        ...current.trust,
                        eyebrow: event.target.value,
                      },
                    }))
                  }
                  className="rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-100 outline-none transition focus:border-zinc-500"
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                Section headline
                <input
                  type="text"
                  value={draft.trust.headline}
                  onChange={(event) =>
                    updateDraft((current) => ({
                      ...current,
                      trust: {
                        ...current.trust,
                        headline: event.target.value,
                      },
                    }))
                  }
                  className="rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-100 outline-none transition focus:border-zinc-500"
                />
              </label>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {draft.trust.items.map((item, index) => (
                <article key={`trust-${index}`} className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Card {index + 1}</p>
                  <div className="mt-3 space-y-3">
                    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                      Eyebrow
                      <input
                        type="text"
                        value={item.eyebrow}
                        onChange={(event) =>
                          updateDraft((current) => ({
                            ...current,
                            trust: {
                              ...current.trust,
                              items: current.trust.items.map((trustItem, trustIndex) =>
                                trustIndex === index ? { ...trustItem, eyebrow: event.target.value } : trustItem
                              ),
                            },
                          }))
                        }
                        className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-100 outline-none transition focus:border-zinc-500"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                      Title
                      <input
                        type="text"
                        value={item.title}
                        onChange={(event) =>
                          updateDraft((current) => ({
                            ...current,
                            trust: {
                              ...current.trust,
                              items: current.trust.items.map((trustItem, trustIndex) =>
                                trustIndex === index ? { ...trustItem, title: event.target.value } : trustItem
                              ),
                            },
                          }))
                        }
                        className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-100 outline-none transition focus:border-zinc-500"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                      Body
                      <textarea
                        rows={4}
                        value={item.body}
                        onChange={(event) =>
                          updateDraft((current) => ({
                            ...current,
                            trust: {
                              ...current.trust,
                              items: current.trust.items.map((trustItem, trustIndex) =>
                                trustIndex === index ? { ...trustItem, body: event.target.value } : trustItem
                              ),
                            },
                          }))
                        }
                        className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-100 outline-none transition focus:border-zinc-500"
                      />
                    </label>
                  </div>
                </article>
              ))}
            </div>
          </SectionShell>

          <SectionShell
            title="FAQ"
            summary="Scope: fixed 4-item FAQ block for homepage readability and predictable layout behavior."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                Section eyebrow
                <input
                  type="text"
                  value={draft.faq.eyebrow}
                  onChange={(event) =>
                    updateDraft((current) => ({
                      ...current,
                      faq: {
                        ...current.faq,
                        eyebrow: event.target.value,
                      },
                    }))
                  }
                  className="rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-100 outline-none transition focus:border-zinc-500"
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                Section headline
                <input
                  type="text"
                  value={draft.faq.headline}
                  onChange={(event) =>
                    updateDraft((current) => ({
                      ...current,
                      faq: {
                        ...current.faq,
                        headline: event.target.value,
                      },
                    }))
                  }
                  className="rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-100 outline-none transition focus:border-zinc-500"
                />
              </label>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {draft.faq.items.map((item, index) => (
                <article key={`faq-${index}`} className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">FAQ item {index + 1}</p>
                  <div className="mt-3 space-y-3">
                    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                      Question
                      <input
                        type="text"
                        value={item.question}
                        onChange={(event) =>
                          updateDraft((current) => ({
                            ...current,
                            faq: {
                              ...current.faq,
                              items: current.faq.items.map((faqItem, faqIndex) =>
                                faqIndex === index ? { ...faqItem, question: event.target.value } : faqItem
                              ),
                            },
                          }))
                        }
                        className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-100 outline-none transition focus:border-zinc-500"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                      Answer
                      <textarea
                        rows={4}
                        value={item.answer}
                        onChange={(event) =>
                          updateDraft((current) => ({
                            ...current,
                            faq: {
                              ...current.faq,
                              items: current.faq.items.map((faqItem, faqIndex) =>
                                faqIndex === index ? { ...faqItem, answer: event.target.value } : faqItem
                              ),
                            },
                          }))
                        }
                        className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-100 outline-none transition focus:border-zinc-500"
                      />
                    </label>
                  </div>
                </article>
              ))}
            </div>
          </SectionShell>

          <SectionShell
            title="Primary CTA"
            summary="Scope: final conversion block near footer, including headline, action label, and exactly 5 quick chips."
          >
            <div className="grid gap-4 md:grid-cols-3">
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400 md:col-span-1">
                Eyebrow
                <input
                  type="text"
                  value={draft.cta.eyebrow}
                  onChange={(event) =>
                    updateDraft((current) => ({
                      ...current,
                      cta: {
                        ...current.cta,
                        eyebrow: event.target.value,
                      },
                    }))
                  }
                  className="rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-100 outline-none transition focus:border-zinc-500"
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400 md:col-span-2">
                Headline
                <input
                  type="text"
                  value={draft.cta.headline}
                  onChange={(event) =>
                    updateDraft((current) => ({
                      ...current,
                      cta: {
                        ...current.cta,
                        headline: event.target.value,
                      },
                    }))
                  }
                  className="rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-100 outline-none transition focus:border-zinc-500"
                />
              </label>
            </div>

            <label className="flex max-w-sm flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
              Button label
              <input
                type="text"
                value={draft.cta.buttonLabel}
                onChange={(event) =>
                  updateDraft((current) => ({
                    ...current,
                    cta: {
                      ...current.cta,
                      buttonLabel: event.target.value,
                    },
                  }))
                }
                className="rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-100 outline-none transition focus:border-zinc-500"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              {draft.cta.chips.map((chip, index) => (
                <label
                  key={`cta-chip-${index}`}
                  className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400"
                >
                  Chip {index + 1}
                  <input
                    type="text"
                    value={chip}
                    onChange={(event) =>
                      updateDraft((current) => ({
                        ...current,
                        cta: {
                          ...current.cta,
                          chips: current.cta.chips.map((currentChip, chipIndex) =>
                            chipIndex === index ? event.target.value : currentChip
                          ),
                        },
                      }))
                    }
                    className="rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-100 outline-none transition focus:border-zinc-500"
                  />
                </label>
              ))}
            </div>

            <article className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">CTA preview</p>
              <p className="mt-3 text-[10px] font-black uppercase tracking-[0.35em] text-zinc-400">{draft.cta.eyebrow}</p>
              <h4 className="mt-2 text-2xl font-black tracking-tight text-zinc-100">{draft.cta.headline}</h4>
              <span className="mt-4 inline-flex rounded-full border border-zinc-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-100">
                {draft.cta.buttonLabel}
              </span>
              <div className="mt-4 flex flex-wrap gap-2">
                {draft.cta.chips.map((chip) => (
                  <span key={chip} className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">
                    {chip}
                  </span>
                ))}
              </div>
            </article>
          </SectionShell>

          <SectionShell
            title="Shipping and Returns Messaging"
            summary="Scope: footer communication cards for delivery and size-support expectations."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <article className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Shipping</p>
                <div className="mt-3 space-y-3">
                  <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                    Title
                    <input
                      type="text"
                      value={draft.shipping.title}
                      onChange={(event) =>
                        updateDraft((current) => ({
                          ...current,
                          shipping: {
                            ...current.shipping,
                            title: event.target.value,
                          },
                        }))
                      }
                      className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-100 outline-none transition focus:border-zinc-500"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                    Message
                    <textarea
                      rows={4}
                      value={draft.shipping.message}
                      onChange={(event) =>
                        updateDraft((current) => ({
                          ...current,
                          shipping: {
                            ...current.shipping,
                            message: event.target.value,
                          },
                        }))
                      }
                      className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-100 outline-none transition focus:border-zinc-500"
                    />
                  </label>
                </div>
              </article>

              <article className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Returns</p>
                <div className="mt-3 space-y-3">
                  <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                    Title
                    <input
                      type="text"
                      value={draft.returns.title}
                      onChange={(event) =>
                        updateDraft((current) => ({
                          ...current,
                          returns: {
                            ...current.returns,
                            title: event.target.value,
                          },
                        }))
                      }
                      className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-100 outline-none transition focus:border-zinc-500"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                    Message
                    <textarea
                      rows={4}
                      value={draft.returns.message}
                      onChange={(event) =>
                        updateDraft((current) => ({
                          ...current,
                          returns: {
                            ...current.returns,
                            message: event.target.value,
                          },
                        }))
                      }
                      className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-100 outline-none transition focus:border-zinc-500"
                    />
                  </label>
                </div>
              </article>
            </div>

            <article className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Footer messaging preview</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-zinc-700 bg-zinc-900/80 px-3 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">{draft.shipping.title}</p>
                  <p className="mt-2 text-sm text-zinc-300">{draft.shipping.message}</p>
                </div>
                <div className="rounded-2xl border border-zinc-700 bg-zinc-900/80 px-3 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">{draft.returns.title}</p>
                  <p className="mt-2 text-sm text-zinc-300">{draft.returns.message}</p>
                </div>
              </div>
            </article>
          </SectionShell>
        </div>
      )}
    </AdminPageFrame>
  );
};

export default AdminContentPage;
