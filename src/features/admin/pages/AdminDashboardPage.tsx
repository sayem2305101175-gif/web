import * as React from 'react';
import { Link } from 'react-router-dom';
import { ADMIN_ROUTE_PATHS } from '../app/adminRoutes';
import { adminCatalogService, adminContentService, adminOrderService } from '../shared/services';
import { getCatalogPublishReadiness } from '../shared/utils/publishReadiness';
import { AdminEmptyState, AdminLoadingState, AdminPageFrame } from '../shared/ui';

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

interface DashboardSnapshot {
  catalogReadyCount: number;
  catalogTotalCount: number;
  catalogCriticalCount: number;
  catalogWarningCount: number;
  orderActiveCount: number;
  orderTotalCount: number;
  publishedProductCount: number;
  contentSectionCount: number;
  contentUpdatedAt: string | null;
}

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

const AdminDashboardPage: React.FC = () => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [refreshWarning, setRefreshWarning] = React.useState<string | null>(null);
  const [snapshot, setSnapshot] = React.useState<DashboardSnapshot | null>(null);
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

      const readinessByProduct = products.map((product) => getCatalogPublishReadiness(product));
      const catalogReadyCount = readinessByProduct.filter((readiness) => readiness.blockingIssues.length === 0).length;
      const catalogCriticalCount = readinessByProduct.filter((readiness) => readiness.blockingIssues.length > 0).length;
      const catalogWarningCount = readinessByProduct.filter((readiness) => readiness.warnings.length > 0).length;
      const orderActiveCount = orders.filter((order) => order.status === 'Pending' || order.status === 'Processing').length;
      const publishedProductCount = products.filter((product) => product.publishState === 'Published').length;

      hasLoadedSnapshotRef.current = true;
      setSnapshot({
        catalogReadyCount,
        catalogTotalCount: products.length,
        catalogCriticalCount,
        catalogWarningCount,
        orderActiveCount,
        orderTotalCount: orders.length,
        publishedProductCount,
        contentSectionCount: sections.length,
        contentUpdatedAt: content.updatedAt,
      });
      setLoadError(null);
      setRefreshWarning(null);
    } catch {
      if (shouldShowLoadingState || !hasLoadedSnapshotRef.current) {
        setLoadError('Operational signals could not be loaded right now.');
        return;
      }

      setRefreshWarning('Operational signals could not be refreshed. Showing last known snapshot.');
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

  return (
    <AdminPageFrame
      eyebrow="Dashboard"
      title="Owner command center"
      summary="Track catalog readiness, order workload, and storefront publishing momentum from a single operational surface."
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
        <AdminLoadingState label="Assembling operational signals..." />
      ) : loadError ? (
        <AdminEmptyState
          tone="error"
          title="Operational signals unavailable."
          description={loadError}
          actionLabel="Retry"
          onAction={() => enqueueSnapshotRefresh({ showLoadingState: true })}
        />
      ) : !snapshot ? (
        <AdminEmptyState
          title="Operational signals unavailable."
          description="Dashboard metrics are waiting for catalog, order, and content state."
        />
      ) : (
        <div className="space-y-4">
          {refreshWarning ? (
            <section className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="text-sm text-amber-100">{refreshWarning}</p>
            </section>
          ) : null}

          <div className="grid gap-4 md:grid-cols-3">
            <SummaryCard
              label="Catalog readiness"
              value={`${snapshot.catalogReadyCount}/${snapshot.catalogTotalCount}`}
              detail={`Critical gaps: ${snapshot.catalogCriticalCount} · Warnings: ${snapshot.catalogWarningCount}`}
              toneClassName={
                snapshot.catalogCriticalCount === 0
                  ? 'border-emerald-500/30 bg-emerald-500/10'
                  : 'border-amber-500/30 bg-amber-500/10'
              }
            />
            <SummaryCard
              label="Order workload"
              value={`${snapshot.orderActiveCount}`}
              detail={`${snapshot.orderTotalCount} total orders currently in operations.`}
              toneClassName={
                snapshot.orderActiveCount === 0
                  ? 'border-emerald-500/30 bg-emerald-500/10'
                  : 'border-sky-500/30 bg-sky-500/10'
              }
            />
            <SummaryCard
              label="Storefront publishing"
              value={`${snapshot.publishedProductCount} live products`}
              detail={
                snapshot.contentUpdatedAt
                  ? `Content modules: ${snapshot.contentSectionCount} · Last content save ${dateTimeFormatter.format(new Date(snapshot.contentUpdatedAt))}`
                  : `Content modules: ${snapshot.contentSectionCount} · No content save timestamp recorded yet.`
              }
            />
          </div>
        </div>
      )}
    </AdminPageFrame>
  );
};

export default AdminDashboardPage;
