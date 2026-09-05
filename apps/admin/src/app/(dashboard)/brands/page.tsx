'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUp, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { adminAlert, adminConfirm } from '@/lib/admin-dialog';

type BrandRow = {
  id: string;
  slug: string;
  nameFr: string;
  nameEn?: string | null;
  sortOrder: number;
  isActive: boolean;
  _count?: { products: number };
};

export default function BrandsListPage() {
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (search.trim()) qs.set('search', search.trim());
      if (status) qs.set('isActive', status);
      const data = await adminApi<BrandRow[]>(
        `/admin/brands${qs.toString() ? `?${qs}` : ''}`,
      );
      setBrands(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    const t = setTimeout(() => void load(), search ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  async function remove(id: string) {
    if (!(await adminConfirm('Supprimer cette marque ?'))) return;
    try {
      await adminApi(`/admin/brands/${id}`, { method: 'DELETE' });
      void load();
    } catch (err) {
      await adminAlert({ message: err instanceof Error ? err.message : 'Erreur', variant: 'error' });
    }
  }

  async function toggle(b: BrandRow) {
    try {
      await adminApi(`/admin/brands/${b.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !b.isActive }),
      });
      void load();
    } catch (err) {
      await adminAlert({ message: err instanceof Error ? err.message : 'Erreur', variant: 'error' });
    }
  }

  async function bump(b: BrandRow, delta: number) {
    try {
      await adminApi(`/admin/brands/${b.id}`, {
        method: 'PUT',
        body: JSON.stringify({ sortOrder: b.sortOrder + delta }),
      });
      void load();
    } catch (err) {
      await adminAlert({ message: err instanceof Error ? err.message : 'Erreur', variant: 'error' });
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Marques</h1>
          <p className="text-sm text-[var(--admin-muted)] mt-0.5">
            {brands.length} marque{brands.length > 1 ? 's' : ''} · liées au site et filtres produits
          </p>
        </div>
        <Link href="/brands/new" className="admin-btn">
          <Plus size={16} /> Nouvelle marque
        </Link>
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
              placeholder="Nom, slug…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="w-40">
          <label className="admin-label">Statut</label>
          <select className="admin-input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Toutes</option>
            <option value="true">Actives</option>
            <option value="false">Inactives</option>
          </select>
        </div>
      </div>

      <div className="admin-card overflow-x-auto !p-0">
        {loading ? (
          <p className="text-center py-10 text-[var(--admin-muted)]">Chargement…</p>
        ) : brands.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <p className="text-[var(--admin-muted)]">Aucune marque</p>
            <Link href="/brands/new" className="admin-btn inline-flex">
              <Plus size={16} /> Créer la première
            </Link>
          </div>
        ) : (
          <table className="admin-table w-full text-sm">
            <thead>
              <tr>
                <th className="pl-5">Marque</th>
                <th>Slug</th>
                <th>Produits</th>
                <th>Ordre</th>
                <th>Statut</th>
                <th className="pr-5" />
              </tr>
            </thead>
            <tbody>
              {brands.map((b) => (
                  <tr key={b.id} className="hover:bg-black/[0.015]">
                    <td className="pl-5">
                      <div>
                        <Link
                          href={`/brands/${b.id}`}
                          className="font-medium hover:text-[var(--admin-rose)]"
                        >
                          {b.nameFr}
                        </Link>
                        {b.nameEn && b.nameEn !== b.nameFr && (
                          <p className="text-[11px] text-[var(--admin-muted)]">{b.nameEn}</p>
                        )}
                      </div>
                    </td>
                    <td className="font-mono text-xs text-[var(--admin-muted)]">{b.slug}</td>
                    <td>{b._count?.products ?? 0}</td>
                    <td>
                      <div className="flex items-center gap-0.5">
                        <span className="w-6 text-center">{b.sortOrder}</span>
                        <button
                          type="button"
                          className="admin-btn-ghost px-1"
                          onClick={() => void bump(b, -1)}
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          className="admin-btn-ghost px-1"
                          onClick={() => void bump(b, 1)}
                        >
                          <ArrowDown size={13} />
                        </button>
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => void toggle(b)}
                        className={b.isActive ? 'admin-badge-ok' : 'admin-badge-black'}
                      >
                        {b.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="pr-5 text-right whitespace-nowrap">
                      <Link href={`/brands/${b.id}`} className="admin-btn-ghost inline-flex">
                        <Pencil size={14} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => void remove(b.id)}
                        className="admin-btn-ghost text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
