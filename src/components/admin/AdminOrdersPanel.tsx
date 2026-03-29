import { useCallback, useDeferredValue, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { AdminOrdersResponse, OrderRecord, OrderStatus } from '../../../shared/orders';
import { orderStatuses } from '../../../shared/orders';

const statusOptions = ['ALL', ...orderStatuses] as const;
const deliveryTimeline: OrderStatus[] = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

const statusStyles: Record<OrderStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  PROCESSING: 'bg-sky-100 text-sky-800',
  SHIPPED: 'bg-violet-100 text-violet-800',
  DELIVERED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-rose-100 text-rose-800',
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(value));
}

async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init);
  const data = (await response.json().catch(() => null)) as { message?: string } | null;

  if (!response.ok) {
    throw new Error(data?.message ?? 'Request failed.');
  }

  return data as T;
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="rounded-3xl border border-white/60 bg-white/85 p-5 shadow-lg backdrop-blur-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gray-400">{label}</p>
      <p className={`mt-3 text-3xl font-black ${accent}`}>{value}</p>
    </div>
  );
}

function OrderTimeline({ status }: { status: OrderStatus }) {
  const activeIndex = deliveryTimeline.indexOf(status);

  if (status === 'CANCELLED') {
    return (
      <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
        Order cancelled
      </div>
    );
  }

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-4">
      {deliveryTimeline.map((step, index) => {
        const done = index <= activeIndex;

        return (
          <div
            key={step}
            className={`rounded-2xl border px-3 py-3 text-center text-xs font-bold tracking-wide ${
              done
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-gray-200 bg-gray-50 text-gray-400'
            }`}
          >
            {step}
          </div>
        );
      })}
    </div>
  );
}

function OrderCard({
  order,
  updating,
  onUpdateStatus,
}: {
  order: OrderRecord;
  updating: boolean;
  onUpdateStatus: (orderId: string, status: OrderStatus) => Promise<void>;
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-xl backdrop-blur-sm"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-2xl font-black text-gray-900">{order.orderNumber}</h3>
            <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${statusStyles[order.status]}`}>
              {order.status}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            {formatDate(order.createdAt)} • {order.customer.name} • {order.itemCount} item{order.itemCount > 1 ? 's' : ''}
          </p>
          <p className="mt-1 text-sm text-gray-500">Source: {order.source === 'buyNow' ? 'Buy Now' : 'Cart Checkout'}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700">
            <input
              type="checkbox"
              checked={order.status === 'DELIVERED'}
              disabled={updating}
              onChange={(event) => {
                void onUpdateStatus(order.id, event.target.checked ? 'DELIVERED' : 'SHIPPED');
              }}
              className="h-4 w-4 rounded border-gray-300"
            />
            Delivered
          </label>

          <select
            value={order.status}
            disabled={updating}
            onChange={(event) => {
              void onUpdateStatus(order.id, event.target.value as OrderStatus);
            }}
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 outline-none transition focus:border-gray-900"
          >
            {orderStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <OrderTimeline status={order.status} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl bg-slate-50 p-5">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-gray-500">Customer</p>
          <div className="mt-3 space-y-2 text-sm text-gray-700">
            <p><span className="font-semibold text-gray-900">Name:</span> {order.customer.name}</p>
            <p><span className="font-semibold text-gray-900">Email:</span> {order.customer.email}</p>
            <p><span className="font-semibold text-gray-900">Phone:</span> {order.customer.phone}</p>
            <p><span className="font-semibold text-gray-900">Address:</span> {order.customer.address}</p>
          </div>
        </div>

        <div className="rounded-3xl bg-slate-50 p-5">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-gray-500">Totals</p>
          <div className="mt-3 space-y-2 text-sm text-gray-700">
            <p className="flex items-center justify-between"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></p>
            <p className="flex items-center justify-between"><span>Shipping</span><span>{formatCurrency(order.shipping)}</span></p>
            <p className="flex items-center justify-between"><span>Handling</span><span>{formatCurrency(order.handling)}</span></p>
            <p className="flex items-center justify-between border-t border-gray-200 pt-3 text-base font-bold text-gray-900">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </p>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Email notification: {order.emailNotificationStatus}
            {order.emailNotificationError ? ` (${order.emailNotificationError})` : ''}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-3xl bg-gray-950 p-5 text-white">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-gray-300">Items</p>
        <div className="mt-4 space-y-3">
          {order.items.map((item) => (
            <div
              key={`${order.id}-${item.productId}`}
              className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <div>
                <p className="font-semibold">{item.productName}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400">{item.category}</p>
              </div>
              <div className="text-right text-sm">
                <p>Qty: {item.quantity}</p>
                <p className="font-semibold">{formatCurrency(item.lineTotal)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.article>
  );
}

interface AdminOrdersPanelProps {
  token: string;
}

export function AdminOrdersPanel({ token }: AdminOrdersPanelProps) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AdminOrdersResponse | null>(null);
  const [statusFilter, setStatusFilter] = useState<(typeof statusOptions)[number]>('ALL');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const deferredSearch = useDeferredValue(searchInput);

  const loadOrders = useCallback(async () => {
    setLoading(true);

    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: '12',
        status: statusFilter,
        search: deferredSearch,
      });

      const response = await requestJson<AdminOrdersResponse>(`/api/admin/orders?${query.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setData(response);
      setError('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load orders.');
    } finally {
      setLoading(false);
    }
  }, [deferredSearch, page, statusFilter, token]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders, refreshKey]);

  async function handleUpdateStatus(orderId: string, status: OrderStatus) {
    setUpdatingOrderId(orderId);
    setError('');

    try {
      await requestJson<{ order: OrderRecord }>(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      setRefreshKey((current) => current + 1);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update order.');
    } finally {
      setUpdatingOrderId(null);
    }
  }

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <SummaryCard label="Total" value={data?.summary.total ?? 0} accent="text-gray-950" />
        <SummaryCard label="Pending" value={data?.summary.pending ?? 0} accent="text-amber-600" />
        <SummaryCard label="Processing" value={data?.summary.processing ?? 0} accent="text-sky-600" />
        <SummaryCard label="Shipped" value={data?.summary.shipped ?? 0} accent="text-violet-600" />
        <SummaryCard label="Delivered" value={data?.summary.delivered ?? 0} accent="text-emerald-600" />
        <SummaryCard label="Cancelled" value={data?.summary.cancelled ?? 0} accent="text-rose-600" />
      </div>

      <div className="mt-6 rounded-[2rem] border border-white/60 bg-white/85 p-5 shadow-xl backdrop-blur-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_220px_auto]">
          <input
            type="search"
            value={searchInput}
            onChange={(event) => {
              setSearchInput(event.target.value);
              setPage(1);
            }}
            placeholder="Search by order number, name, email, or phone"
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm outline-none transition focus:border-gray-900"
          />

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as (typeof statusOptions)[number]);
              setPage(1);
            }}
            className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm font-semibold text-gray-700 outline-none transition focus:border-gray-900"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status === 'ALL' ? 'All statuses' : status}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setRefreshKey((current) => current + 1)}
            className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm font-semibold text-gray-700 shadow-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">
          {error}
        </div>
      ) : null}

      {loading && !data ? (
        <div className="mt-6 rounded-[2rem] border border-white/60 bg-white/80 px-6 py-10 text-center text-gray-500 shadow-xl backdrop-blur-sm">
          Loading orders...
        </div>
      ) : null}

      <div className="mt-6 space-y-5">
        {data?.orders.length ? (
          data.orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              updating={updatingOrderId === order.id}
              onUpdateStatus={handleUpdateStatus}
            />
          ))
        ) : (
          <div className="rounded-[2rem] border border-white/60 bg-white/80 px-6 py-10 text-center text-gray-500 shadow-xl backdrop-blur-sm">
            No orders match the current filters yet.
          </div>
        )}
      </div>

      {data ? (
        <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-[2rem] border border-white/60 bg-white/85 px-5 py-4 shadow-xl backdrop-blur-sm sm:flex-row">
          <p className="text-sm text-gray-500">
            Page {data.pagination.page} of {data.pagination.pages} • {data.pagination.total} orders found
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              disabled={data.pagination.page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={data.pagination.page >= data.pagination.pages}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
