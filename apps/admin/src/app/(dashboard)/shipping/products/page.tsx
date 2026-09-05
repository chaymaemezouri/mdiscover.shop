'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search } from 'lucide-react';
import { adminApi, type AdminProduct } from '@/lib/api';
import { adminAlert } from '@/lib/admin-dialog';
import { formatPrice } from '@/lib/utils';

export default function ShippingProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [feeFilter, setFeeFilter] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: '1', limit: '100' });
      if (search.trim()) qs.set('search', search.trim());
      const res = await adminApi<{ data: AdminProduct[]; meta?: { total?: number } }>(
        `/admin/products?${qs}`,
      );
      let list = res.data ?? [];
      if (feeFilter === 'with') list = list.filter((p) => p.hasShippingFee !== false);
      if (feeFilter === 'without') list = list.filter((p) => p.hasShippingFee === false);
      setProducts(list);
      setTotal(res.meta?.total ?? list.length);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, feeFilter]);

  useEffect(() => {
    const t = setTimeout(() => void load(), search ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  async function toggleShippingFee(product: AdminProduct, hasShippingFee: boolean) {
    setSavingId(product.id);
    try {
      await adminApi(`/admin/products/${product.id}`, {
        method: 'PUT',
        body: JSON.stringify({ hasShippingFee }),
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, hasShippingFee } : p)),
      );
    } catch (err) {
      await adminAlert({ message: err instanceof Error ? err.message : 'Erreur', variant: 'error' });
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-start gap-3">
          <Link href="/shipping" className="admin-btn-ghost mt-0.5">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold">Frais par produit</h1>
            <p className="text-sm text-[var(--admin-muted)] mt-0.5">
              {products.length} affiché{products.length > 1 ? 's' : ''}
              {total ? ` · ${total} au total` : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="admin-card mb-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="admin-label">Recherche</label>
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-muted)]"
            />
            <input
              className="admin-input pl-9"
              placeholder="Nom produit…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="w-48">
          <label className="admin-label">Frais</label>
          <select
            className="admin-input"
            value={feeFilter}
            onChange={(e) => setFeeFilter(e.target.value)}
          >
            <option value="">Tous</option>
            <option value="with">Avec frais</option>
            <option value="without">Sans frais</option>
          </select>
        </div>
      </div>

      <div className="admin-card overflow-x-auto !p-0">
        {loading ? (
          <p className="text-center py-10 text-[var(--admin-muted)]">Chargement…</p>
        ) : products.length === 0 ? (
          <p className="text-center py-12 text-[var(--admin-muted)]">Aucun produit</p>
        ) : (
          <table className="admin-table w-full text-sm">
            <thead>
              <tr>
                <th className="pl-5">Produit</th>
                <th>Catégorie</th>
                <th>Prix</th>
                <th className="pr-5">Frais de livraison</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const hasFee = p.hasShippingFee !== false;
                const busy = savingId === p.id;
                return (
                  <tr key={p.id} className="hover:bg-black/[0.015]">
                    <td className="pl-5 font-medium">{p.nameFr}</td>
                    <td className="text-[var(--admin-muted)]">{p.category?.nameFr ?? '—'}</td>
                    <td className="whitespace-nowrap">{formatPrice(p.basePrice)}</td>
                    <td className="pr-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void toggleShippingFee(p, true)}
                          className={
                            hasFee
                              ? 'admin-btn text-xs py-1 px-2.5'
                              : 'admin-btn-outline text-xs py-1 px-2.5'
                          }
                        >
                          Avec frais
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void toggleShippingFee(p, false)}
                          className={
                            !hasFee
                              ? 'admin-btn-black text-xs py-1 px-2.5'
                              : 'admin-btn-outline text-xs py-1 px-2.5'
                          }
                        >
                          Sans frais
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
