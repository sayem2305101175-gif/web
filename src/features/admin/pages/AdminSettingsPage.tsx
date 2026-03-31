import * as React from 'react';
import { Link } from 'react-router-dom';
import { ADMIN_ROUTE_PATHS } from '../app/adminRoutes';
import { adminCatalogService, adminContentService, adminOrderService } from '../shared/services';
import { AdminEmptyState, AdminLoadingState, AdminPageFrame } from '../shared/ui';
import { resolveCommerceRepositoryMode } from '../../commerce/repositories';
import { isBackendConfigured } from '../../../services/apiClient';

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

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

const ActionCard: React.FC<{ title: string; detail: string; to: string; ctaLabel: string }> = ({
  ctaLabel,
  detail,
  title,
  to,
}) => (
  <article className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5">
    <h3 className="text-lg font-black tracking-tight text-zinc-100">{title}</h3>
    <p className="mt-2 text-sm leading-relaxed text-zinc-400">{detail}</p>
    <Link
      to={to}
      className="mt-4 inline-flex rounded-full border border-zinc-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-100 transition hover:border-zinc-500"
    >
      {ctaLabel}
    </Link>
  </article>
);

interface SettingsSnapshot {
  catalogCount: number;
  publishedCount: number;
  orderCount: number;
  processingOrderCount: number;
  contentSectionCount: number;
  contentUpdatedAt: string | null;
}

const AdminSettingsPage: React.FC = () => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [refreshWarning, setRefreshWarning] = React.useState<string | null>(null);
  const [snapshot, setSnapshot] = React.useState<SettingsSnapshot | null>(null);
  const hasLoadedSnapshotRef = React.useRef(false);
  const isRefreshInFlightRef = React.useRef(false);
  const hasQueuedRefreshRef = React.useRef(false);
  const isBackgroundRefreshScheduledRef = React.useRef(false);

  const loadSnapshot = React.useCallback(async (options?: { showLoadingState?: boolean }) => {
    const shouldShowLoadingState = options?.showLoadingState !== false;
    if (shouldShowLoadingState) {
      setIsLoading(true);
      setLoadError(null);
    }

    try {
      const [products, orders, sections, content] = await Promise.all([
        adminCatalogService.listProducts(),
        adminOrderService.listOrders(),
        adminContentService.listSections(),
        adminContentService.getStorefrontContent(),
      ]);

      setSnapshot({
        catalogCount: products.length,
        publishedCount: products.filter((product) => product.publishState === 'Published').length,
        orderCount: orders.length,
        processingOrderCount: orders.filter((order) => order.status === 'Pending' || order.status === 'Processing').length,
        contentSectionCount: sections.length,
        contentUpdatedAt: content.updatedAt,
      });
      hasLoadedSnapshotRef.current = true;
      setLoadError(null);
      setRefreshWarning(null);
    } catch {
      if (shouldShowLoadingState || !hasLoadedSnapshotRef.current) {
        setLoadError('Operational snapshot could not be loaded right now.');
        return;
      }

      setRefreshWarning('Operational snapshot could not be refreshed. Showing last known state.');
    } finally {
      if (shouldShowLoadingState) {
        setIsLoading(false);
      }
    }
  }, []);

  const enqueueSnapshotRefresh = React.useCallback(
    (options?: { showLoadingState?: boolean }) => {
      const initialShowLoadingState = options?.showLoadingState !== false;
      if (isRefreshInFlightRef.current) {
        hasQueuedRefreshRef.current = true;
        return;
      }

      isRefreshInFlightRef.current = true;

      const run = async () => {
        let showLoadingState = initialShowLoadingState;
        do {
          hasQueuedRefreshRef.current = false;
          await loadSnapshot({ showLoadingState });
          showLoadingState = false;
        } while (hasQueuedRefreshRef.current);

        isRefreshInFlightRef.current = false;
      };

      void run();
    },
    [loadSnapshot]
  );

  const scheduleBackgroundRefresh = React.useCallback(() => {
    if (isBackgroundRefreshScheduledRef.current) {
      return;
    }

    isBackgroundRefreshScheduledRef.current = true;
    queueMicrotask(() => {
      isBackgroundRefreshScheduledRef.current = false;
      enqueueSnapshotRefresh({ showLoadingState: false });
    });
  }, [enqueueSnapshotRefresh]);

  React.useEffect(() => {
    enqueueSnapshotRefresh({ showLoadingState: true });
    const unsubscribeCatalog = adminCatalogService.subscribe?.(() => {
      scheduleBackgroundRefresh();
    });
    const unsubscribeOrders = adminOrderService.subscribe?.(() => {
      scheduleBackgroundRefresh();
    });
    const unsubscribeContent = adminContentService.subscribe?.(() => {
      scheduleBackgroundRefresh();
    });

    return () => {
      unsubscribeCatalog?.();
      unsubscribeOrders?.();
      unsubscribeContent?.();
      isBackgroundRefreshScheduledRef.current = false;
      hasQueuedRefreshRef.current = false;
      isRefreshInFlightRef.current = false;
    };
  }, [enqueueSnapshotRefresh, scheduleBackgroundRefresh]);

  const repositoryMode = resolveCommerceRepositoryMode();
  const isLocalPreviewMode = repositoryMode === 'local-preview';

  return (
    <AdminPageFrame
      eyebrow="Settings"
      title="Operational controls"
      summary="This surface is intentionally read-only. It explains the active operating mode and points to the routes where real catalog, content, and fulfillment changes happen."
    >
      {isLoading ? (
        <AdminLoadingState label="Loading platform controls..." />
      ) : loadError ? (
        <AdminEmptyState
          tone="error"
          title="Operational snapshot unavailable."
          description={loadError}
          actionLabel="Retry"
          onAction={() => enqueueSnapshotRefresh({ showLoadingState: true })}
        />
      ) : !snapshot ? (
        <AdminEmptyState
          title="Operational snapshot unavailable."
          description="Settings are waiting for the current catalog, content, and order state."
        />
      ) : (
        <div className="space-y-4">
          {refreshWarning ? (
            <section className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="text-sm text-amber-100">{refreshWarning}</p>
            </section>
          ) : null}

          <div className="grid gap-4 md:grid-cols-4">
            <SummaryCard
              label="Repository mode"
              value={isLocalPreviewMode ? 'Local preview' : 'Backend'}
              detail={
                isLocalPreviewMode
                  ? 'Admin and storefront are sharing the same self-contained preview store.'
                  : 'Admin and storefront are reading through the backend repository adapters.'
              }
              toneClassName={
                isLocalPreviewMode
                  ? 'border-sky-500/30 bg-sky-500/10'
                  : 'border-emerald-500/30 bg-emerald-500/10'
              }
            />
            <SummaryCard
              label="API base URL"
              value={isBackendConfigured ? 'Configured' : 'Disabled'}
              detail={
                isBackendConfigured
                  ? 'Runtime transport is enabled for backend-backed requests.'
                  : 'No backend URL is configured, so self-contained preview mode remains the source of truth.'
              }
            />
            <SummaryCard
              label="Catalog live count"
              value={`${snapshot.publishedCount}/${snapshot.catalogCount}`}
              detail="Published products versus the full tracked assortment."
            />
            <SummaryCard
              label="Order workload"
              value={`${snapshot.processingOrderCount}`}
              detail={`${snapshot.orderCount} total orders currently stored in operations.`}
            />
          </div>

          <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4 md:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.23em] text-zinc-500">Scope decision</p>
            <h3 className="mt-2 text-lg font-black tracking-tight text-zinc-100">No fake platform toggles live here.</h3>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400">
              Product lifecycle, storefront copy, and order processing already have complete self-contained workflows on their own routes.
              This page stays honest by showing runtime state and directing operators to those real control surfaces instead of exposing staged settings that do nothing.
            </p>
            <p className="mt-3 text-sm text-zinc-300">
              Storefront content sections tracked: <span className="font-semibold text-zinc-100">{snapshot.contentSectionCount}</span>
              {snapshot.contentUpdatedAt
                ? ` · Last content save ${dateTimeFormatter.format(new Date(snapshot.contentUpdatedAt))}`
                : ' · No content save timestamp recorded yet.'}
            </p>
          </section>

          <div className="grid gap-4 md:grid-cols-3">
            <ActionCard
              title="Catalog and media policy"
              detail="Create drafts, publish ready products, and fix missing image or model coverage from the catalog workspace."
              to={ADMIN_ROUTE_PATHS.catalog}
              ctaLabel="Open catalog"
            />
            <ActionCard
              title="Storefront copy and featured product"
              detail="Update hero messaging, FAQ, CTA copy, and featured-product merchandising from the content route."
              to={ADMIN_ROUTE_PATHS.content}
              ctaLabel="Open content"
            />
            <ActionCard
              title="Fulfillment workflow"
              detail="Manage customer orders, inspect details, and apply operational status changes from the orders queue."
              to={ADMIN_ROUTE_PATHS.orders}
              ctaLabel="Open orders"
            />
          </div>
        </div>
      )}
    </AdminPageFrame>
  );
};

export default AdminSettingsPage;
