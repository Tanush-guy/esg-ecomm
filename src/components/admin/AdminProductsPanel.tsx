import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { Product } from '../../data/products';
import { apiUrl } from '../../lib/api';

interface ProductSummary {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  lowStockProducts: number;
  totalInventoryUnits: number;
  totalSoldUnits: number;
}

interface AdminProductsResponse {
  products: Product[];
  summary: ProductSummary;
}

interface ProductFormState {
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  inventoryCount: number;
  soldCount: number;
  isActive: boolean;
}

const emptyForm: ProductFormState = {
  name: '',
  price: 0,
  image: '',
  category: '',
  description: '',
  inventoryCount: 0,
  soldCount: 0,
  isActive: true,
};

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

async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init);
  const data = (await response.json().catch(() => null)) as { message?: string } | null;

  if (!response.ok) {
    throw new Error(data?.message ?? 'Request failed.');
  }

  return data as T;
}

function toFormState(product: Product): ProductFormState {
  return {
    name: product.name,
    price: product.price,
    image: product.image,
    category: product.category,
    description: product.description,
    inventoryCount: product.inventoryCount,
    soldCount: product.soldCount,
    isActive: product.isActive,
  };
}

interface AdminProductsPanelProps {
  token: string;
}

export function AdminProductsPanel({ token }: AdminProductsPanelProps) {
  const [data, setData] = useState<AdminProductsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadProducts = useCallback(async () => {
    setLoading(true);

    try {
      const response = await requestJson<AdminProductsResponse>(apiUrl('/api/admin/products'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setData(response);
      setError('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load products.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts, refreshKey]);

  const filteredProducts = useMemo(() => {
    if (!data) {
      return [];
    }

    const term = search.trim().toLowerCase();

    if (!term) {
      return data.products;
    }

    return data.products.filter((product) =>
      [product.name, product.category, product.description]
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }, [data, search]);

  function resetForm() {
    setForm(emptyForm);
    setEditingProductId(null);
  }

  function beginEdit(product: Product) {
    setEditingProductId(product.id);
    setForm(toFormState(product));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const endpoint = editingProductId ? apiUrl(`/api/admin/products/${editingProductId}`) : apiUrl('/api/admin/products');
      const method = editingProductId ? 'PATCH' : 'POST';

      await requestJson<{ product: Product }>(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      resetForm();
      setRefreshKey((current) => current + 1);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to save product.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(productId: number) {
    setError('');

    try {
      await requestJson<void>(apiUrl(`/api/admin/products/${productId}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (editingProductId === productId) {
        resetForm();
      }

      setRefreshKey((current) => current + 1);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to delete product.');
    }
  }

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <SummaryCard label="Products" value={data?.summary.totalProducts ?? 0} accent="text-gray-950" />
        <SummaryCard label="Active" value={data?.summary.activeProducts ?? 0} accent="text-emerald-600" />
        <SummaryCard label="Inactive" value={data?.summary.inactiveProducts ?? 0} accent="text-gray-500" />
        <SummaryCard label="Low Stock" value={data?.summary.lowStockProducts ?? 0} accent="text-amber-600" />
        <SummaryCard label="Inventory" value={data?.summary.totalInventoryUnits ?? 0} accent="text-sky-600" />
        <SummaryCard label="Sold" value={data?.summary.totalSoldUnits ?? 0} accent="text-violet-600" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[420px_1fr]">
        <form onSubmit={handleSubmit} className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-sky-600">Product Editor</p>
              <h2 className="mt-2 text-2xl font-black text-gray-950">
                {editingProductId ? 'Update product' : 'Add new product'}
              </h2>
            </div>
            {editingProductId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700"
              >
                Cancel
              </button>
            ) : null}
          </div>

          <div className="mt-6 space-y-4">
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Product name"
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-gray-900"
              required
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <input
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                placeholder="Category"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-gray-900"
                required
              />
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.price}
                onChange={(event) => setForm((current) => ({ ...current, price: Number(event.target.value) }))}
                placeholder="Price"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-gray-900"
                required
              />
            </div>

            <input
              value={form.image}
              onChange={(event) => setForm((current) => ({ ...current, image: event.target.value }))}
              placeholder="Image URL"
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-gray-900"
              required
            />

            <textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Product description"
              className="min-h-[140px] w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-gray-900"
              required
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <input
                type="number"
                min={0}
                value={form.inventoryCount}
                onChange={(event) => setForm((current) => ({ ...current, inventoryCount: Number(event.target.value) }))}
                placeholder="Inventory count"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-gray-900"
                required
              />
              <input
                type="number"
                min={0}
                value={form.soldCount}
                onChange={(event) => setForm((current) => ({ ...current, soldCount: Number(event.target.value) }))}
                placeholder="Sold count"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-gray-900"
                required
              />
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                className="h-4 w-4 rounded border-gray-300"
              />
              Product is visible on the storefront
            </label>
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="mt-6 w-full rounded-2xl bg-gradient-to-r from-gray-950 to-slate-700 px-5 py-4 text-base font-black text-white transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? 'Saving...' : editingProductId ? 'Update product' : 'Create product'}
          </button>
        </form>

        <div className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-xl backdrop-blur-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-sky-600">Inventory</p>
              <h2 className="mt-2 text-2xl font-black text-gray-950">Manage live storefront products</h2>
            </div>
            <div className="flex gap-3">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-gray-900 lg:w-72"
              />
              <button
                type="button"
                onClick={() => setRefreshKey((current) => current + 1)}
                className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm"
              >
                Refresh
              </button>
            </div>
          </div>

          {loading && !data ? (
            <div className="mt-6 rounded-3xl border border-dashed border-gray-200 px-6 py-10 text-center text-gray-500">
              Loading products...
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {filteredProducts.map((product) => (
                <div key={product.id} className="rounded-3xl border border-gray-100 bg-slate-50 p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-500">{product.category}</p>
                      <h3 className="mt-2 text-xl font-black text-gray-950">{product.name}</h3>
                      <p className="mt-2 text-sm text-gray-500">
                        INR {product.price.toFixed(2)} • {product.isActive ? 'Active' : 'Hidden'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => beginEdit(product)}
                        className="rounded-full bg-gray-950 px-4 py-2 text-sm font-semibold text-white"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(product.id)}
                        className="rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs uppercase tracking-wide text-gray-400">Stock</p>
                      <p className="mt-1 text-lg font-bold text-gray-900">{product.inventoryCount}</p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs uppercase tracking-wide text-gray-400">Sold</p>
                      <p className="mt-1 text-lg font-bold text-gray-900">{product.soldCount}</p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs uppercase tracking-wide text-gray-400">Status</p>
                      <p className={`mt-1 text-sm font-bold ${product.isActive ? 'text-emerald-600' : 'text-gray-500'}`}>
                        {product.isActive ? 'Visible' : 'Hidden'}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 line-clamp-3 text-sm text-gray-600">{product.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
