import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { ADMIN_ROUTE_PATHS, resolveCatalogEditorPath } from '../app/adminRoutes';
import { adminCatalogEditorService, adminCatalogService } from '../shared/services';
import { AdminConfirmDialog, AdminEmptyState, AdminLoadingState, AdminPageFrame } from '../shared/ui';
import type { AdminCatalogProductSummary } from '../shared/types';
import { getCatalogPublishReadiness } from '../shared/utils';

type CatalogReadinessLevel = 'Ready' | 'Warning' | 'Critical';

const priceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const resolveReadiness = (product: AdminCatalogProductSummary) => {
  const report = getCatalogPublishReadiness(product);

  if (report.blockingIssues.length > 0) {
    return { level: 'Critical' as CatalogReadinessLevel, issues: report.blockingIssues };
  }

  if (report.warnings.length > 0) {
    return { level: 'Warning' as CatalogReadinessLevel, issues: report.warnings };
  }

  return { level: 'Ready' as CatalogReadinessLevel, issues: [] };
};

const resolveReadinessClassName = (level: CatalogReadinessLevel) => {
  if (level === 'Critical') {
    return 'border-rose-500/40 bg-rose-500/10 text-rose-200';
  }
  if (level === 'Warning') {
    return 'border-amber-500/40 bg-amber-500/10 text-amber-200';
  }
  return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200';
};

const resolvePublishStateClassName = (publishState: AdminCatalogProductSummary['publishState']) => {
  if (publishState === 'Published') {
    return 'border-emerald-600/40 bg-emerald-600/10 text-emerald-200';
  }
  if (publishState === 'Archived') {
    return 'border-zinc-600/50 bg-zinc-800 text-zinc-300';
  }
  return 'border-sky-500/40 bg-sky-500/10 text-sky-200';
};

const AdminCatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [allProducts, setAllProducts] = React.useState<AdminCatalogProductSummary[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('All');
  const [publishStateFilter, setPublishStateFilter] = React.useState<'All' | AdminCatalogProductSummary['publishState']>(
    'All'
  );
  const [stockFilter, setStockFilter] = React.useState<'All' | AdminCatalogProductSummary['stockStatus']>('All');
  const [actionNotice, setActionNotice] = React.useState<string | null>(null);
  const [actionNoticeTone, setActionNoticeTone] = React.useState<'neutral' | 'success' | 'warning'>('neutral');
  const [pendingAction, setPendingAction] = React.useState<{
    type: 'duplicate' | 'archive' | 'unpublish';
    product: AdminCatalogProductSummary;
  } | null>(null);
  const [isConfirmingAction, setIsConfirmingAction] = React.useState(false);

  const loadProducts = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const result = await adminCatalogService.listProducts();
      setAllProducts(result);
    } catch {
      setLoadError('Unable to load catalog products right now.');
      setAllProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const categoryOptions = ['All', ...new Set(allProducts.map((product) => product.category))];
  const publishStateOptions: Array<'All' | AdminCatalogProductSummary['publishState']> = [
    'All',
    'Draft',
    'Published',
    'Archived',
  ];
  const stockOptions: Array<'All' | AdminCatalogProductSummary['stockStatus']> = [
    'All',
    'In stock',
    'Low stock',
    'Waitlist',
  ];

  const filteredProducts = allProducts.filter((product) => {
    if (categoryFilter !== 'All' && product.category !== categoryFilter) {
      return false;
    }

    if (publishStateFilter !== 'All' && product.publishState !== publishStateFilter) {
      return false;
    }

    if (stockFilter !== 'All' && product.stockStatus !== stockFilter) {
      return false;
    }

    if (!searchQuery.trim()) {
      return true;
    }

    const normalizedSearch = searchQuery.trim().toLowerCase();
    return (
      product.name.toLowerCase().includes(normalizedSearch) ||
      product.brand.toLowerCase().includes(normalizedSearch) ||
      product.category.toLowerCase().includes(normalizedSearch) ||
      product.id.toLowerCase().includes(normalizedSearch)
    );
  });
  const readinessSummary = React.useMemo(() => {
    let ready = 0;
    let warning = 0;
    let critical = 0;
    let publishReady = 0;

    filteredProducts.forEach((product) => {
      const readinessReport = getCatalogPublishReadiness(product);
      if (readinessReport.blockingIssues.length > 0) {
        critical += 1;
      } else if (readinessReport.warnings.length > 0) {
        warning += 1;
      } else {
        ready += 1;
        publishReady += 1;
      }
    });

    return { critical, publishReady, ready, warning };
  }, [filteredProducts]);

  const openDuplicateConfirmation = (product: AdminCatalogProductSummary) => {
    setPendingAction({ type: 'duplicate', product });
  };

  const openArchiveOrUnpublishConfirmation = (product: AdminCatalogProductSummary) => {
    setPendingAction({
      type: product.publishState === 'Published' ? 'unpublish' : 'archive',
      product,
    });
  };

  const resetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('All');
    setPublishStateFilter('All');
    setStockFilter('All');
    setActionNotice(null);
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) {
      return;
    }

    setIsConfirmingAction(true);

    try {
      if (pendingAction.type === 'duplicate') {
        const duplicated = await adminCatalogEditorService.duplicateProduct(pendingAction.product.id);
        if (!duplicated) {
          setActionNotice(`Unable to duplicate "${pendingAction.product.name}" right now.`);
          setActionNoticeTone('warning');
          return;
        }

        setActionNoticeTone('success');
        setActionNotice(
          `Duplicated "${pendingAction.product.name}" at ${new Date(duplicated.duplicatedAt).toLocaleTimeString()}. Opening the new draft editor now.`
        );
        await loadProducts();
        navigate(resolveCatalogEditorPath(duplicated.productId), {
          state: {
            catalogEditorNotice: {
              message: `Duplicated "${pendingAction.product.name}" at ${new Date(duplicated.duplicatedAt).toLocaleTimeString()}. The new copy opened as a draft and remains hidden from storefront routes until you publish it.`,
              tone: 'success',
            },
          },
        });
      } else if (pendingAction.type === 'unpublish') {
        const unpublished = await adminCatalogEditorService.unpublishProduct(pendingAction.product.id);
        if (!unpublished) {
          setActionNotice(`Unable to unpublish "${pendingAction.product.name}" right now.`);
          setActionNoticeTone('warning');
          return;
        }

        setActionNotice(
          `Unpublished "${pendingAction.product.name}" at ${new Date(unpublished.unpublishedAt).toLocaleTimeString()}. It is back in Draft and removed from storefront visibility.`
        );
        setActionNoticeTone('success');
        await loadProducts();
      } else {
        const archived = await adminCatalogEditorService.archiveProduct(pendingAction.product.id);
        if (!archived) {
          setActionNotice(`Unable to archive "${pendingAction.product.name}" right now.`);
          setActionNoticeTone('warning');
          return;
        }

        setActionNotice(
          `Archived "${pendingAction.product.name}" at ${new Date(archived.archivedAt).toLocaleTimeString()}. It stays out of active storefront assortment until you publish it again.`
        );
        setActionNoticeTone('success');
        await loadProducts();
      }
    } finally {
      setPendingAction(null);
      setIsConfirmingAction(false);
    }
  };

  const dialogTitle = React.useMemo(() => {
    if (!pendingAction) {
      return '';
    }

    if (pendingAction.type === 'duplicate') {
      return `Create draft duplicate for ${pendingAction.product.name}?`;
    }

    if (pendingAction.type === 'unpublish') {
      return `Unpublish ${pendingAction.product.name}?`;
    }

    return `Archive ${pendingAction.product.name}?`;
  }, [pendingAction]);

  const dialogDescription = React.useMemo(() => {
    if (!pendingAction) {
      return '';
    }

    if (pendingAction.type === 'duplicate') {
      return 'This creates a new draft copy, keeps it off the storefront, reloads the catalog, and opens the new draft in the editor.';
    }

    if (pendingAction.type === 'unpublish') {
      return 'This moves the product back to Draft, reloads the catalog, and removes it from storefront visibility until it is published again.';
    }

    return 'This moves the product to Archived, reloads the catalog, and keeps it out of active storefront assortment.';
  }, [pendingAction]);

  const dialogConfirmLabel =
    pendingAction?.type === 'duplicate'
      ? 'Confirm duplicate'
      : pendingAction?.type === 'unpublish'
        ? 'Unpublish product'
        : 'Archive product';
  const dialogTone = pendingAction && pendingAction.type !== 'duplicate' ? 'danger' : 'default';

  return (
    <AdminPageFrame
      eyebrow="Catalog"
      title="Product library"
      summary="Monitor product readiness, maintain assortment quality, and prepare launch drops for publish review."
      actions={
        <button
          type="button"
          className="inline-flex rounded-full border border-zinc-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-100 transition hover:border-zinc-400"
          onClick={() => navigate(ADMIN_ROUTE_PATHS.catalogCreate)}
        >
          New draft
        </button>
      }
    >
      {isLoading ? (
        <AdminLoadingState label="Loading product library..." />
      ) : loadError ? (
        <AdminEmptyState
          tone="error"
          title="Catalog unavailable."
          description={loadError}
          actionLabel="Retry"
          onAction={() => void loadProducts()}
        />
      ) : allProducts.length === 0 ? (
        <AdminEmptyState
          title="Catalog is ready for first draft entries."
          description="No products are loaded in admin yet. Use the catalog editor route to create your first product draft and define publish-ready information."
          actionLabel="Open catalog editor"
          onAction={() => navigate(ADMIN_ROUTE_PATHS.catalogCreate)}
        />
      ) : (
        <div className="space-y-4">
          <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4 md:p-5">
            <div className="grid gap-3 md:grid-cols-4">
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                Search
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Name, brand, category, or ID"
                  className="rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-100 outline-none transition focus:border-zinc-500"
                />
              </label>

              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                Category
                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-100 outline-none transition focus:border-zinc-500"
                >
                  {categoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                Publish state
                <select
                  value={publishStateFilter}
                  onChange={(event) =>
                    setPublishStateFilter(event.target.value as 'All' | AdminCatalogProductSummary['publishState'])
                  }
                  className="rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-100 outline-none transition focus:border-zinc-500"
                >
                  {publishStateOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                Stock
                <select
                  value={stockFilter}
                  onChange={(event) =>
                    setStockFilter(event.target.value as 'All' | AdminCatalogProductSummary['stockStatus'])
                  }
                  className="rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-100 outline-none transition focus:border-zinc-500"
                >
                  {stockOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-zinc-400">
                Showing <span className="font-semibold text-zinc-200">{filteredProducts.length}</span> of{' '}
                <span className="font-semibold text-zinc-200">{allProducts.length}</span> products
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400 transition hover:text-zinc-200"
              >
                Reset filters
              </button>
            </div>
          </section>

          {actionNotice ? (
            <section
              role="status"
              aria-live="polite"
              className={`rounded-2xl border px-4 py-3 ${
                actionNoticeTone === 'success'
                  ? 'border-emerald-500/30 bg-emerald-500/10'
                  : actionNoticeTone === 'warning'
                    ? 'border-amber-500/30 bg-amber-500/10'
                    : 'border-sky-500/30 bg-sky-500/10'
              }`}
            >
              <p
                className={`text-sm ${
                  actionNoticeTone === 'success'
                    ? 'text-emerald-100'
                    : actionNoticeTone === 'warning'
                      ? 'text-amber-100'
                      : 'text-sky-100'
                }`}
              >
                {actionNotice}
              </p>
            </section>
          ) : null}

          <section className="grid gap-3 md:grid-cols-4">
            <article className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Publish-ready</p>
              <p className="mt-2 text-xl font-black tracking-tight text-emerald-300">{readinessSummary.publishReady}</p>
            </article>
            <article className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Ready</p>
              <p className="mt-2 text-xl font-black tracking-tight text-zinc-100">{readinessSummary.ready}</p>
            </article>
            <article className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Warnings</p>
              <p className="mt-2 text-xl font-black tracking-tight text-amber-200">{readinessSummary.warning}</p>
            </article>
            <article className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Blocked</p>
              <p className="mt-2 text-xl font-black tracking-tight text-rose-300">{readinessSummary.critical}</p>
            </article>
          </section>

          {filteredProducts.length === 0 ? (
            <AdminEmptyState
              title="No products match the current filters."
              description="Try clearing filters or adjusting search terms to find product entries."
              actionLabel="Clear filters"
              onAction={resetFilters}
            />
          ) : (
            <section className="overflow-x-auto rounded-3xl border border-zinc-800 bg-zinc-900/70">
              <table className="min-w-[860px] w-full border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/90 text-left">
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Name</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Brand</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Category</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Price</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Stock</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                      Publish state
                    </th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Readiness</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
                    const readiness = resolveReadiness(product);
                    const actionLabel = product.publishState === 'Published' ? 'Unpublish' : 'Archive';

                    return (
                      <tr key={product.id} className="border-b border-zinc-800/80 align-top last:border-b-0">
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-zinc-100">{product.name}</p>
                          <p className="text-xs text-zinc-500">ID {product.id}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-300">{product.brand}</td>
                        <td className="px-4 py-3 text-sm text-zinc-300">{product.category}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-zinc-100">{priceFormatter.format(product.price)}</td>
                        <td className="px-4 py-3 text-sm text-zinc-300">{product.stockStatus}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${resolvePublishStateClassName(product.publishState)}`}
                          >
                            {product.publishState}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${resolveReadinessClassName(readiness.level)}`}
                          >
                            {readiness.level}
                          </span>
                          {readiness.issues.length > 0 ? (
                            <p className="mt-1 text-xs text-zinc-400">{readiness.issues.join(', ')}</p>
                          ) : (
                            <p className="mt-1 text-xs text-zinc-500">Critical fields present.</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => navigate(resolveCatalogEditorPath(product.id))}
                              className="rounded-full border border-zinc-600 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-100 transition hover:border-zinc-400"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => openDuplicateConfirmation(product)}
                              className="rounded-full border border-zinc-700 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100"
                            >
                              Duplicate
                            </button>
                            <button
                              type="button"
                              onClick={() => openArchiveOrUnpublishConfirmation(product)}
                              className="rounded-full border border-zinc-700 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100"
                            >
                              {actionLabel}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          )}
        </div>
      )}
      <AdminConfirmDialog
        isOpen={Boolean(pendingAction)}
        title={dialogTitle}
        description={dialogDescription}
        confirmLabel={dialogConfirmLabel}
        tone={dialogTone}
        isConfirming={isConfirmingAction}
        onCancel={() => {
          if (!isConfirmingAction) {
            setPendingAction(null);
          }
        }}
        onConfirm={() => void handleConfirmAction()}
      />
    </AdminPageFrame>
  );
};

export default AdminCatalogPage;
