import { useState } from 'react';
import type { FormEvent } from 'react';
import type { AdminLoginResponse } from '../../shared/orders';
import { AdminOrdersPanel } from './admin/AdminOrdersPanel';
import { AdminProductsPanel } from './admin/AdminProductsPanel';

const adminTokenStorageKey = 'essential-goods-admin-token';

async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init);
  const data = (await response.json().catch(() => null)) as { message?: string } | null;

  if (!response.ok) {
    throw new Error(data?.message ?? 'Request failed.');
  }

  return data as T;
}

interface AdminDashboardProps {
  adminPath: string;
}

export function AdminDashboard({ adminPath }: AdminDashboardProps) {
  const [token, setToken] = useState<string | null>(() => window.sessionStorage.getItem(adminTokenStorageKey));
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState<'products' | 'orders'>('products');

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await requestJson<AdminLoginResponse>('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      window.sessionStorage.setItem(adminTokenStorageKey, response.token);
      setToken(response.token);
      setPassword('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to log in.');
    } finally {
      setSubmitting(false);
    }
  }

  function logout() {
    window.sessionStorage.removeItem(adminTokenStorageKey);
    setToken(null);
    setError('');
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(30,64,175,0.14),_transparent_40%),linear-gradient(135deg,#f8fafc_0%,#dbeafe_48%,#ecfeff_100%)] px-4 py-10 text-gray-900">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[2.5rem] border border-white/60 bg-white/80 p-8 shadow-2xl backdrop-blur-sm">
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-sky-600">Private Admin</p>
              <h1 className="mt-4 text-5xl font-black leading-tight text-gray-950">Manage products, inventory, and delivery from one backend-powered dashboard.</h1>
              <p className="mt-4 max-w-xl text-lg text-gray-600">
                The storefront no longer exposes the admin entry. This route is only available directly at <span className="font-semibold text-gray-900">{adminPath}</span>.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/60 bg-white/90 p-5 shadow-lg">
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gray-400">Catalog</p>
                  <p className="mt-3 text-3xl font-black text-sky-600">Live</p>
                </div>
                <div className="rounded-3xl border border-white/60 bg-white/90 p-5 shadow-lg">
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gray-400">Inventory</p>
                  <p className="mt-3 text-3xl font-black text-violet-600">Editable</p>
                </div>
                <div className="rounded-3xl border border-white/60 bg-white/90 p-5 shadow-lg">
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gray-400">Orders</p>
                  <p className="mt-3 text-3xl font-black text-emerald-600">Tracked</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleLogin} className="rounded-[2.5rem] border border-gray-200 bg-gray-950 p-8 text-white shadow-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-cyan-300">Secure Login</p>
              <h2 className="mt-4 text-3xl font-black">Sign in to manage the store</h2>
              <p className="mt-3 text-sm text-gray-300">
                Use the admin password from your environment settings. Keep this route private and deploy it behind HTTPS.
              </p>

              <label className="mt-8 block text-sm font-semibold text-gray-200">
                Admin password
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-base outline-none transition placeholder:text-gray-400 focus:border-cyan-300"
                  placeholder="Enter your admin password"
                  autoComplete="current-password"
                  required
                />
              </label>

              {error ? (
                <div className="mt-4 rounded-2xl border border-rose-300/50 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="mt-6 w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-4 text-base font-black text-gray-950 transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? 'Signing in...' : 'Open dashboard'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.14),_transparent_35%),linear-gradient(135deg,#f8fafc_0%,#dbeafe_38%,#eef2ff_100%)] px-4 py-8 text-gray-900">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[2.5rem] border border-white/60 bg-white/85 p-6 shadow-2xl backdrop-blur-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-sky-600">Essential Goods Admin</p>
              <h1 className="mt-3 text-4xl font-black text-gray-950">Products, inventory, and delivery control.</h1>
              <p className="mt-3 max-w-3xl text-gray-600">
                Use the products tab to change names, pricing, images, stock, visibility, and statistics. Use the orders tab to track delivery status.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={logout}
                className="rounded-full bg-gray-950 px-5 py-3 text-sm font-semibold text-white shadow-sm"
              >
                Log out
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setTab('products')}
              className={`rounded-full px-5 py-3 text-sm font-semibold ${
                tab === 'products' ? 'bg-gray-950 text-white' : 'border border-gray-200 bg-white text-gray-700'
              }`}
            >
              Products
            </button>
            <button
              type="button"
              onClick={() => setTab('orders')}
              className={`rounded-full px-5 py-3 text-sm font-semibold ${
                tab === 'orders' ? 'bg-gray-950 text-white' : 'border border-gray-200 bg-white text-gray-700'
              }`}
            >
              Orders
            </button>
          </div>
        </div>

        <div className="mt-6">
          {tab === 'products' ? <AdminProductsPanel token={token} /> : <AdminOrdersPanel token={token} />}
        </div>
      </div>
    </div>
  );
}
