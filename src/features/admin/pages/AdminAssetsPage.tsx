import * as React from 'react';
import { Link } from 'react-router-dom';
import { ADMIN_ROUTE_PATHS, resolveCatalogEditorPath } from '../app/adminRoutes';
import { adminCatalogService } from '../shared/services';
import { AdminEmptyState, AdminLoadingState, AdminPageFrame } from '../shared/ui';
import type { AdminCatalogProductSummary } from '../shared/types';

const readinessToneClassName = (count: number) =>
  count === 0
    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
    : 'border-amber-500/30 bg-amber-500/10 text-amber-100';

const statusToneClassName = (publishState: AdminCatalogProductSummary['publishState']) => {
  if (publishState === 'Published') {
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100';
  }
  if (publishState === 'Archived') {
    return 'border-zinc-700 bg-zinc-950/80 text-zinc-200';
  }
  return 'border-sky-500/30 bg-sky-500/10 text-sky-100';
};

const describeGaps = (product: AdminCatalogProductSummary) => {
  const missing: string[] = [];

  if (!product.hasHeroImage) {
    missing.push('Hero image');
  }

  if (!product.hasModel3d) {
    missing.push('3D model');
  }

  return missing;
};

const SummaryCard: React.FC<{ label: string; value: string; detail: string; toneClassName?: string }> = ({
  detail,
  label,
  toneClassName,
  value,
}) => (
  <article className={`rounded-3xl border bg-zinc-900/70 p-5 ${toneClassName ?? 'border-zinc-800'}`}>
    <p className="text-[11px] font-semibold uppercase tracking-[0.23em] text-zinc-500">{label}</p>
    <p className="mt-3 text-xl font-black tracking-tight text-zinc-100">{value}</p>
    <p className="mt-2 text-sm leading-relaxed text-zinc-300">{detail}</p>
  </article>
);

const AdminAssetsPage: React.FC = () => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [refreshWarning, setRefreshWarning] = React.useState<string | null>(null);
  const [products, setProducts] = React.useState<AdminCatalogProductSummary[]>([]);
  const hasLoadedSnapshotRef = React.useRef(false);

  const loadProducts = React.useCallback(async (options?: { showLoadingState?: boolean }) => {
    const shouldShowLoadingState = options?.showLoadingState !== false;
    if (shouldShowLoadingState) {
      setIsLoading(true);
      setLoadError(null);
    }

    try {
      const nextProducts = await adminCatalogService.listProducts();
      hasLoadedSnapshotRef.current = true;
      setProducts(nextProducts);
      setLoadError(null);
      setRefreshWarning(null);
    } catch {
      if (shouldShowLoadingState || !hasLoadedSnapshotRef.current) {
        setLoadError('Asset readiness could not be loaded right now.');
        return;
      }

      setRefreshWarning('Asset inventory could not be refreshed. Showing last known snapshot.');
    } finally {
      if (shouldShowLoadingState) {
        setIsLoading(false);
      }
    }
  }, []);

  React.useEffect(() => {
    void loadProducts({ showLoadingState: true });
    const unsubscribe = adminCatalogService.subscribe(() => {
      void loadProducts({ showLoadingState: false });
    });

    return () => {
      unsubscribe?.();
    };
  }, [loadProducts]);

  const assetsNeedingAttention = React.useMemo(
    () =>
      products
        .filter((product) => !product.hasHeroImage || !product.hasModel3d)
        .sort((firstProduct, secondProduct) => {
          const publishStateRank = (publishState: AdminCatalogProductSummary['publishState']) => {
            if (publishState === 'Published') {
              return 0;
            }
            if (publishState === 'Draft') {
              return 1;
            }
            return 2;
          };

          const rankDifference =
            publishStateRank(firstProduct.publishState) - publishStateRank(secondProduct.publishState);

          if (rankDifference !== 0) {
            return rankDifference;
          }

          return firstProduct.name.localeCompare(secondProduct.name);
        }),
    [products]
  );

  const fullyReadyProducts = React.useMemo(
    () => products.filter((product) => product.hasHeroImage && product.hasModel3d),
    [products]
  );
  const publishedProductsMissingAssets = React.useMemo(
    () => assetsNeedingAttention.filter((product) => product.publishState === 'Published'),
    [assetsNeedingAttention]
  );
  const missingHeroImageCount = React.useMemo(
    () => products.filter((product) => !product.hasHeroImage).length,
    [products]
  );
  const missingModelCount = React.useMemo(
    () => products.filter((product) => !product.hasModel3d).length,
    [products]
  );

  return (
    <AdminPageFrame
      eyebrow="Assets"
      title="Media and 3D inventory"
      summary="Audit image and model coverage across the catalog so storefront cards and product pages stay publish-safe without placeholder media."
      actions={
        <Link
          to={ADMIN_ROUTE_PATHS.catalogCreate}
          className="inline-flex rounded-full border border-zinc-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-100 transition hover:border-zinc-400"
        >
          New product draft
        </Link>
      }
    >
      {isLoading ? (
        <AdminLoadingState label="Loading asset inventory..." />
      ) : loadError ? (
        <AdminEmptyState
          tone="error"
          title="Asset inventory unavailable."
          description={loadError}
          actionLabel="Retry"
          onAction={() => void loadProducts()}
        />
      ) : products.length === 0 ? (
        <div className="space-y-4">
          <AdminEmptyState
            title="No product media tracked yet."
            description="Create the first catalog draft to start tracking hero image and 3D model readiness."
          />
          <div>
            <Link
              to={ADMIN_ROUTE_PATHS.catalogCreate}
              className="inline-flex rounded-full border border-zinc-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-100 transition hover:border-zinc-500"
            >
              Create product draft
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {refreshWarning ? (
            <section className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="text-sm text-amber-100">{refreshWarning}</p>
            </section>
          ) : null}

          <div className="grid gap-4 md:grid-cols-4">
            <SummaryCard
              label="Catalog coverage"
              value={`${fullyReadyProducts.length}/${products.length}`}
              detail="Products with both hero image and 3D model coverage."
              toneClassName={readinessToneClassName(assetsNeedingAttention.length)}
            />
            <SummaryCard
              label="Published risk"
              value={`${publishedProductsMissingAssets.length}`}
              detail="Live products still missing at least one required media asset."
              toneClassName={readinessToneClassName(publishedProductsMissingAssets.length)}
            />
            <SummaryCard
              label="Missing hero image"
              value={`${missingHeroImageCount}`}
              detail="Products that still need a storefront-ready primary image."
            />
            <SummaryCard
              label="Missing 3D model"
              value={`${missingModelCount}`}
              detail="Products that still need an immersive model URL."
            />
          </div>

          {assetsNeedingAttention.length === 0 ? (
            <section className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.23em] text-emerald-300">All clear</p>
              <h3 className="mt-3 text-lg font-black tracking-tight text-emerald-50">Every tracked product has media coverage.</h3>
              <p className="mt-2 text-sm leading-relaxed text-emerald-100/90">
                Catalog cards and product detail routes can rely on both hero imagery and 3D models for the current assortment.
              </p>
            </section>
          ) : (
            <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4 md:p-5">
              <header className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.23em] text-zinc-500">Needs attention</p>
                  <h3 className="mt-2 text-lg font-black tracking-tight text-zinc-100">Products missing required media</h3>
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400">
                    Prioritize published products first, then clear draft gaps before publishing new assortment.
                  </p>
                </div>
                <Link
                  to={ADMIN_ROUTE_PATHS.catalog}
                  className="inline-flex rounded-full border border-zinc-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-100 transition hover:border-zinc-500"
                >
                  Open catalog
                </Link>
              </header>

              <div className="grid gap-3">
                {assetsNeedingAttention.map((product) => {
                  const missing = describeGaps(product);

                  return (
                    <article
                      key={product.id}
                      className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-4 md:flex md:items-start md:justify-between md:gap-4"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-base font-black tracking-tight text-zinc-100">{product.name}</h4>
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${statusToneClassName(product.publishState)}`}
                          >
                            {product.publishState}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-zinc-400">
                          {product.brand} · {product.category} · ID {product.id}
                        </p>
                        <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                          Missing: <span className="font-semibold text-zinc-100">{missing.join(' + ')}</span>
                        </p>
                      </div>

                      <div className="mt-4 flex shrink-0 md:mt-0">
                        <Link
                          to={resolveCatalogEditorPath(product.id)}
                          className="inline-flex rounded-full border border-zinc-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-100 transition hover:border-zinc-500"
                        >
                          Fix in editor
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </AdminPageFrame>
  );
};

export default AdminAssetsPage;
