import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { resolveOrderDetailPath } from '../app/adminRoutes';
import { adminOrderService } from '../shared/services';
import { AdminConfirmDialog, AdminEmptyState, AdminLoadingState, AdminPageFrame } from '../shared/ui';
import type { AdminOrderDetail, AdminOrderStatus, AdminOrderSummary } from '../shared/types';
import { useAdminUnsavedChangesGuard } from '../shared/utils';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const ORDER_STATUS_OPTIONS: Array<'All' | AdminOrderStatus> = [
  'All',
  'Pending',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
];

const resolveStatusClassName = (status: AdminOrderStatus) => {
  if (status === 'Pending') {
    return 'border-amber-500/40 bg-amber-500/10 text-amber-200';
  }
  if (status === 'Processing') {
    return 'border-sky-500/40 bg-sky-500/10 text-sky-200';
  }
  if (status === 'Shipped') {
    return 'border-indigo-500/40 bg-indigo-500/10 text-indigo-200';
  }
  if (status === 'Delivered') {
    return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200';
  }
  return 'border-rose-500/40 bg-rose-500/10 text-rose-200';
};

const AdminOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const [isLoadingOrders, setIsLoadingOrders] = React.useState(true);
  const [orders, setOrders] = React.useState<AdminOrderSummary[]>([]);
  const [ordersError, setOrdersError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'All' | AdminOrderStatus>('All');

  const [isLoadingDetail, setIsLoadingDetail] = React.useState(false);
  const [orderDetail, setOrderDetail] = React.useState<AdminOrderDetail | null>(null);
  const [detailError, setDetailError] = React.useState<string | null>(null);
  const [statusDraft, setStatusDraft] = React.useState<AdminOrderStatus>('Pending');
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);
  const [statusUpdateMessage, setStatusUpdateMessage] = React.useState<string | null>(null);
  const [isStatusConfirmDialogOpen, setIsStatusConfirmDialogOpen] = React.useState(false);
  const orderDetailRef = React.useRef<AdminOrderDetail | null>(null);
  const statusDraftRef = React.useRef<AdminOrderStatus>('Pending');

  React.useEffect(() => {
    orderDetailRef.current = orderDetail;
  }, [orderDetail]);

  React.useEffect(() => {
    statusDraftRef.current = statusDraft;
  }, [statusDraft]);

  const loadOrders = React.useCallback(async (options?: { background?: boolean }) => {
    if (!options?.background) {
      setIsLoadingOrders(true);
    }
    setOrdersError(null);

    try {
      const result = await adminOrderService.listOrders();
      setOrders(result);
    } catch {
      setOrdersError('Unable to load order queue right now.');
    } finally {
      if (!options?.background) {
        setIsLoadingOrders(false);
      }
    }
  }, []);

  const refreshOrderDetail = React.useCallback(async (targetOrderId: string) => {
    try {
      const detail = await adminOrderService.getOrderDetail(targetOrderId);
      if (!detail) {
        setOrderDetail(null);
        setDetailError('Order detail could not be found.');
        return;
      }

      const hasPendingLocalDraft =
        orderDetailRef.current?.id === detail.id && statusDraftRef.current !== orderDetailRef.current.status;

      setDetailError(null);
      setOrderDetail(detail);
      if (!hasPendingLocalDraft) {
        setStatusDraft(detail.status);
      }
    } catch {
      setDetailError('Order detail could not be loaded right now.');
    }
  }, []);

  React.useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  React.useEffect(() => {
    const unsubscribe = adminOrderService.subscribe(() => {
      void loadOrders({ background: true });
      if (orderId) {
        void refreshOrderDetail(orderId);
      }
    });

    return unsubscribe;
  }, [loadOrders, orderId, refreshOrderDetail]);

  React.useEffect(() => {
    if (!orderId) {
      setOrderDetail(null);
      setDetailError(null);
      return;
    }

    let isMounted = true;
    setIsLoadingDetail(true);
    setDetailError(null);
    setStatusUpdateMessage(null);

    const loadDetail = async () => {
      try {
        const detail = await adminOrderService.getOrderDetail(orderId);

        if (!isMounted) {
          return;
        }

        if (!detail) {
          setOrderDetail(null);
          setDetailError('Order detail could not be found.');
          return;
        }

        setOrderDetail(detail);
        setStatusDraft(detail.status);
      } catch {
        if (!isMounted) {
          return;
        }
        setOrderDetail(null);
        setDetailError('Order detail could not be loaded right now.');
      } finally {
        if (isMounted) {
          setIsLoadingDetail(false);
        }
      }
    };

    void loadDetail();

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  const hasPendingStatusChange = Boolean(orderDetail && statusDraft !== orderDetail.status);
  useAdminUnsavedChangesGuard(hasPendingStatusChange, 'You have an un-applied order status change. Leave anyway?');

  const filteredOrders = React.useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return orders.filter((order) => {
      if (statusFilter !== 'All' && order.status !== statusFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return (
        order.id.toLowerCase().includes(normalizedSearch) ||
        order.customerName.toLowerCase().includes(normalizedSearch) ||
        order.customerEmail.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [orders, searchQuery, statusFilter]);

  const handleOpenOrder = (id: string) => {
    navigate(resolveOrderDetailPath(id));
  };

  const handleUpdateStatus = async () => {
    if (!orderDetail || statusDraft === orderDetail.status) {
      return;
    }

    setIsUpdatingStatus(true);
    setStatusUpdateMessage(null);

    try {
      const updated = await adminOrderService.updateOrderStatus(orderDetail.id, statusDraft);
      if (!updated) {
        setStatusUpdateMessage('Unable to update status because the order could not be found.');
        setIsUpdatingStatus(false);
        return;
      }

      setOrderDetail(updated);
      setOrders((currentOrders) =>
        currentOrders.map((order) => (order.id === updated.id ? { ...order, status: updated.status } : order))
      );
      setStatusUpdateMessage(`Order status updated to ${updated.status}.`);
      setIsStatusConfirmDialogOpen(false);
    } catch {
      setStatusUpdateMessage('Unable to update order status right now.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const resetOrderFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
  };

  const confirmDialogTone = statusDraft === 'Cancelled' ? 'danger' : 'default';

  return (
    <AdminPageFrame
      eyebrow="Orders"
      title="Fulfillment operations"
      summary="Manage order lifecycle from intake through delivery with clear customer context and status control."
    >
      {isLoadingOrders ? (
        <AdminLoadingState label="Loading order queue..." />
      ) : ordersError ? (
        <AdminEmptyState
          tone="error"
          title="Order queue unavailable."
          description={ordersError}
          actionLabel="Retry"
          onAction={() => void loadOrders()}
        />
      ) : orders.length === 0 ? (
        <AdminEmptyState
          title="No active orders in queue."
          description="Orders will appear here once checkout activity starts flowing into operations."
        />
      ) : (
        <div className="space-y-4">
          <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4 md:p-5">
            <div className="grid gap-3 md:grid-cols-3">
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                Search orders
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Order ID, customer name, email"
                  className="rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-100 outline-none transition focus:border-zinc-500"
                />
              </label>

              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                Status
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as 'All' | AdminOrderStatus)}
                  className="rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-100 outline-none transition focus:border-zinc-500"
                >
                  {ORDER_STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex flex-col justify-end">
                <button
                  type="button"
                  onClick={resetOrderFilters}
                  className="rounded-full border border-zinc-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100"
                >
                  Reset filters
                </button>
              </div>
            </div>
            <p className="mt-3 text-xs text-zinc-400">
              Showing <span className="font-semibold text-zinc-200">{filteredOrders.length}</span> of{' '}
              <span className="font-semibold text-zinc-200">{orders.length}</span> orders
            </p>
          </section>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <article className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/70">
              {filteredOrders.length === 0 ? (
                <div className="p-4">
                  <AdminEmptyState
                    title="No orders match current filters."
                    description="Adjust search terms or reset the status filter to view more orders."
                    actionLabel="Clear filters"
                    onAction={resetOrderFilters}
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-[740px] w-full border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-900/95 text-left">
                        <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Order</th>
                        <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Customer</th>
                        <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Delivery</th>
                        <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Total</th>
                        <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((order) => {
                        const isSelected = order.id === orderId;
                        return (
                          <tr
                            key={order.id}
                            role="button"
                            tabIndex={0}
                            className={`cursor-pointer border-b border-zinc-800/80 transition hover:bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40 last:border-b-0 ${
                              isSelected ? 'bg-zinc-900' : ''
                            }`}
                            onClick={() => handleOpenOrder(order.id)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                handleOpenOrder(order.id);
                              }
                            }}
                          >
                            <td className="px-4 py-3">
                              <p className="text-sm font-semibold text-zinc-100">{order.id}</p>
                              <p className="text-xs text-zinc-500">{dateTimeFormatter.format(new Date(order.createdAt))}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm text-zinc-200">{order.customerName}</p>
                              <p className="text-xs text-zinc-500">{order.customerEmail}</p>
                            </td>
                            <td className="px-4 py-3 text-sm text-zinc-300">{order.deliveryMethod}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-zinc-100">{currencyFormatter.format(order.total)}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${resolveStatusClassName(order.status)}`}
                              >
                                {order.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </article>

            <article className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4 md:p-5">
              {isLoadingDetail ? (
                <AdminLoadingState label="Loading order detail..." />
              ) : detailError ? (
                <AdminEmptyState tone="error" title="Order detail unavailable." description={detailError} />
              ) : !orderId ? (
                <AdminEmptyState
                  title="Select an order to review."
                  description="Choose an order from the queue to inspect customer info, notes, totals, and status actions."
                />
              ) : !orderDetail ? (
                <AdminEmptyState title="Order detail unavailable." description="This order is not available right now." />
              ) : (
                <div className="space-y-4">
                  <header className="rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Order detail</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black tracking-tight text-zinc-100">{orderDetail.id}</h3>
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${resolveStatusClassName(orderDetail.status)}`}
                      >
                        {orderDetail.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-zinc-400">{dateTimeFormatter.format(new Date(orderDetail.createdAt))}</p>
                  </header>

                  <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Status action</p>
                    <div className="mt-3 flex flex-wrap items-end gap-2">
                      <label className="flex min-w-[180px] flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                        Update status
                        <select
                          value={statusDraft}
                          onChange={(event) => setStatusDraft(event.target.value as AdminOrderStatus)}
                          className="rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-100 outline-none transition focus:border-zinc-500"
                        >
                          {ORDER_STATUS_OPTIONS.filter((option) => option !== 'All').map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsStatusConfirmDialogOpen(true)}
                        disabled={isUpdatingStatus || statusDraft === orderDetail.status}
                        className="rounded-full border border-zinc-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-100 transition hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isUpdatingStatus ? 'Updating...' : 'Review change'}
                      </button>
                    </div>
                    {statusUpdateMessage ? (
                      <p role="status" aria-live="polite" className="mt-2 text-sm text-zinc-300">
                        {statusUpdateMessage}
                      </p>
                    ) : null}
                  </section>

                  <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Customer & delivery</p>
                    <div className="mt-2 space-y-1 text-sm text-zinc-300">
                      <p>
                        <span className="text-zinc-500">Name:</span> {orderDetail.customerName}
                      </p>
                      <p>
                        <span className="text-zinc-500">Email:</span> {orderDetail.customerEmail}
                      </p>
                      <p>
                        <span className="text-zinc-500">Phone:</span> {orderDetail.customerPhone}
                      </p>
                      <p>
                        <span className="text-zinc-500">Delivery:</span> {orderDetail.deliveryMethod}
                      </p>
                      <p>
                        <span className="text-zinc-500">Address:</span> {orderDetail.shippingAddress}, {orderDetail.shippingCity},{' '}
                        {orderDetail.shippingCountry}
                      </p>
                      <p>
                        <span className="text-zinc-500">Notes:</span> {orderDetail.notes || 'No customer notes.'}
                      </p>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Totals</p>
                    <div className="mt-2 space-y-1 text-sm text-zinc-300">
                      <p>
                        <span className="text-zinc-500">Items:</span> {orderDetail.itemCount}
                      </p>
                      <p>
                        <span className="text-zinc-500">Subtotal:</span> {currencyFormatter.format(orderDetail.subtotal)}
                      </p>
                      <p>
                        <span className="text-zinc-500">Shipping:</span> {currencyFormatter.format(orderDetail.shippingFee)}
                      </p>
                      <p className="font-semibold text-zinc-100">
                        <span className="text-zinc-500">Total:</span> {currencyFormatter.format(orderDetail.total)}
                      </p>
                    </div>
                  </section>

                  <section className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950/60">
                    <table className="min-w-[540px] w-full border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-800 text-left">
                          <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Product</th>
                          <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Size</th>
                          <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Qty</th>
                          <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Unit</th>
                          <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Line total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderDetail.lineItems.map((item) => (
                          <tr key={item.id} className="border-b border-zinc-800/80 last:border-b-0">
                            <td className="px-3 py-2">
                              <p className="text-sm text-zinc-100">{item.productName}</p>
                              <p className="text-xs text-zinc-500">Product {item.productId}</p>
                            </td>
                            <td className="px-3 py-2 text-sm text-zinc-300">{item.size}</td>
                            <td className="px-3 py-2 text-sm text-zinc-300">{item.quantity}</td>
                            <td className="px-3 py-2 text-sm text-zinc-300">{currencyFormatter.format(item.unitPrice)}</td>
                            <td className="px-3 py-2 text-sm font-semibold text-zinc-100">{currencyFormatter.format(item.lineTotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </section>
                </div>
              )}
            </article>
          </section>
        </div>
      )}
      <AdminConfirmDialog
        isOpen={Boolean(orderDetail) && isStatusConfirmDialogOpen && hasPendingStatusChange}
        title={`Apply status change for ${orderDetail?.id ?? 'order'}?`}
        description={`This updates order status from ${orderDetail?.status ?? 'current'} to ${statusDraft}.`}
        confirmLabel="Apply status"
        tone={confirmDialogTone}
        isConfirming={isUpdatingStatus}
        onCancel={() => {
          if (!isUpdatingStatus) {
            setIsStatusConfirmDialogOpen(false);
          }
        }}
        onConfirm={() => void handleUpdateStatus()}
      />
    </AdminPageFrame>
  );
};

export default AdminOrdersPage;
