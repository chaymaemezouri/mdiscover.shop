'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminApi, type AdminProduct, type Category } from '@/lib/api';
import { adminAlert, adminConfirm } from '@/lib/admin-dialog';
import { formatPrice } from '@/lib/utils';
import { Copy, Pencil, Plus, Trash2 } from 'lucide-react';

function ProductsListInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [meta, setMeta] = useState({ total: 0 });

  useEffect(() => {
    if (searchParams.get('lowStock') === '1') setLowStockOnly(true);
    if (searchParams.get('new') === '1') router.replace('/products/new');
    const editId = searchParams.get('edit');
    if (editId) router.replace(`/products/${editId}`);
    const cat = searchParams.get('categoryId');
    if (cat) setCategoryId(cat);
  }, [searchParams, router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: '1', limit: '100' });
      if (search.trim()) qs.set('search', search.trim());
      if (status) qs.set('status', status);
      if (categoryId) qs.set('categoryId', categoryId);

      const [prodRes, cats] = await Promise.all([
        adminApi<{ data: AdminProduct[]; meta: { total: number } }>(`/admin/products?${qs}`),
        adminApi<Category[]>('/admin/categories').catch(async () => {
          const base = process.env.NEXT_PUBLIC_ADMIN_API_URL ?? 'http://localhost:4000/api/v1';
          const r = await fetch(`${base}/categories`);
          if (!r.ok) return [];
          return r.json();
        }),
      ]);
      setProducts(prodRes.data ?? []);
      setMeta({ total: prodRes.meta?.total ?? prodRes.data?.length ?? 0 });
      setCategories(Array.isArray(cats) ? cats : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, status, categoryId]);

  useEffect(() => {
    const t = setTimeout(() => void load(), search ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const displayed = lowStockOnly
    ? products.filter((p) => p.variants?.some((v) => v.stock <= 5))
    : products;

  async function handleDelete(id: string) {
    if (!(await adminConfirm('Supprimer ce produit ?'))) return;
    await adminApi(`/admin/products/${id}`, { method: 'DELETE' });
    void load();
  }

  async function handleDuplicate(id: string) {
    await adminApi(`/admin/products/${id}/duplicate`, { method: 'POST' });
    void load();
  }

  async function exportCsv() {
    const token = localStorage.getItem('admin_token');
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_ADMIN_API_URL ?? 'http://localhost:4000/api/v1'}/admin/products/export/csv`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    );
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products.csv';
    a.click();
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-semibold">Produits</h1>
          <p className="text-sm text-[var(--admin-muted)] mt-0.5">
            {displayed.length} affiché{displayed.length > 1 ? 's' : ''}
            {meta.total ? ` · ${meta.total} au total` : ''}
            {lowStockOnly ? ' · stock faible' : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void exportCsv()} className="admin-btn-outline">
            Export CSV
          </button>
          <label className="admin-btn-outline cursor-pointer">
            Import CSV
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const csv = await file.text();
                try {
                  const result = await adminApi<{ created: number; updated: number }>(
                    '/admin/products/import/csv',
                    { method: 'POST', body: JSON.stringify({ csv }) },
                  );
                  await adminAlert({
                    message: `Import: ${result.created} créés, ${result.updated} maj`,
                    variant: 'success',
                  });
                  void load();
                } catch (err) {
                  await adminAlert({
                    message: err instanceof Error ? err.message : 'Import échoué',
                    variant: 'error',
                  });
                }
              }}
            />
          </label>
          <Link href="/products/new" className="admin-btn">
            <Plus size={15} /> Nouveau produit
          </Link>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          placeholder="Rechercher…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-input max-w-xs"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="admin-input w-auto"
        >
          <option value="">Tous statuts</option>
          <option value="PUBLISHED">Publié</option>
          <option value="DRAFT">Brouillon</option>
          <option value="ARCHIVED">Archivé</option>
          <option value="OUT_OF_STOCK">Rupture</option>
        </select>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="admin-input w-auto"
        >
          <option value="">Toutes catégories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nameFr}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setLowStockOnly((v) => !v)}
          className={lowStockOnly ? 'admin-btn text-xs' : 'admin-btn-outline text-xs'}
        >
          Stock faible
        </button>
      </div>

      <div className="admin-card overflow-x-auto">
        {loading ? (
          <p className="text-center py-8 text-[var(--admin-muted)]">Chargement…</p>
        ) : displayed.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-[var(--admin-muted)] mb-4">Aucun produit</p>
            <Link href="/products/new" className="admin-btn">
              Créer un produit
            </Link>
          </div>
        ) : (
          <table className="admin-table w-full text-sm">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Catégorie</th>
                <th>Prix</th>
                <th>Stock</th>
                <th>Statut</th>
                <th>Badges</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {displayed.map((p) => {
                const stock = p.variants?.reduce((s, v) => s + v.stock, 0) ?? 0;
                const img = p.images?.[0]?.url;
                return (
                  <tr key={p.id} className="hover:bg-black/[0.02]">
                    <td>
                      <Link href={`/products/${p.id}`} className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-md overflow-hidden bg-black/[0.04] border border-[var(--admin-line)] shrink-0">
                          {img ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate hover:text-[var(--admin-rose)]">
                            {p.nameFr}
                          </p>
                          <p className="text-[11px] text-[var(--admin-muted)] font-mono truncate">
                            {p.slug}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="text-[var(--admin-muted)]">{p.category?.nameFr ?? '—'}</td>
                    <td className="tabular-nums">
                      {formatPrice(p.basePrice)}
                      {p.compareAtPrice ? (
                        <span className="block text-[11px] text-[var(--admin-muted)] line-through">
                          {formatPrice(p.compareAtPrice)}
                        </span>
                      ) : null}
                    </td>
                    <td>
                      <span className={stock <= 5 ? 'admin-badge-rose' : 'tabular-nums'}>{stock}</span>
                    </td>
                    <td>
                      <span
                        className={
                          p.status === 'PUBLISHED' ? 'admin-badge-ok' : 'admin-badge-black'
                        }
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="text-[11px] text-[var(--admin-muted)]">
                      {[p.isNew && 'New', p.isBestseller && 'Best', p.hasShippingFee === false && 'Franco']
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </td>
                    <td>
                      <div className="flex justify-end gap-0.5">
                        <Link href={`/products/${p.id}`} className="admin-btn-ghost" title="Modifier">
                          <Pencil size={15} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => void handleDuplicate(p.id)}
                          className="admin-btn-ghost"
                          title="Dupliquer"
                        >
                          <Copy size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(p.id)}
                          className="admin-btn-ghost text-red-600"
                          title="Supprimer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function ProductsAdminPage() {
  return (
    <Suspense fallback={<p className="text-sm text-[var(--admin-muted)]">Chargement…</p>}>
      <ProductsListInner />
    </Suspense>
  );
}
