'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import { adminAlert, adminConfirm } from '@/lib/admin-dialog';
import { categoryImageSrc } from '@/lib/category-image';
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react';

type CategoryRow = {
  id: string;
  slug: string;
  nameFr: string;
  nameEn?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  parentId?: string | null;
  sortOrder: number;
  isActive: boolean;
  parent?: { id: string; nameFr: string } | null;
  _count?: { products: number; children: number };
};

export default function CategoriesAdminPage() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams();
      if (search.trim()) qs.set('search', search.trim());
      if (status) qs.set('isActive', status);
      const data = await adminApi<CategoryRow[]>(
        `/admin/categories${qs.toString() ? `?${qs}` : ''}`,
      );
      setCategories(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Erreur chargement');
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    const t = setTimeout(() => void load(), search ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  async function remove(id: string) {
    if (!(await adminConfirm('Supprimer cette catégorie ?'))) return;
    try {
      await adminApi(`/admin/categories/${id}`, { method: 'DELETE' });
      void load();
    } catch (err) {
      await adminAlert({ message: err instanceof Error ? err.message : 'Erreur', variant: 'error' });
    }
  }

  async function toggleActive(c: CategoryRow) {
    try {
      await adminApi(`/admin/categories/${c.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !c.isActive }),
      });
      void load();
    } catch (err) {
      await adminAlert({ message: err instanceof Error ? err.message : 'Erreur', variant: 'error' });
    }
  }

  async function bumpOrder(c: CategoryRow, delta: number) {
    try {
      await adminApi(`/admin/categories/${c.id}`, {
        method: 'PUT',
        body: JSON.stringify({ sortOrder: c.sortOrder + delta }),
      });
      void load();
    } catch (err) {
      await adminAlert({ message: err instanceof Error ? err.message : 'Erreur', variant: 'error' });
    }
  }

  const activeCount = categories.filter((c) => c.isActive).length;
  const rootCount = categories.filter((c) => !c.parentId).length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Catégories</h1>
          <p className="text-sm text-[var(--admin-muted)] mt-0.5">
            {categories.length} affichée{categories.length > 1 ? 's' : ''}
            {!search && !status ? ` · ${activeCount} active${activeCount > 1 ? 's' : ''} · ${rootCount} racine${rootCount > 1 ? 's' : ''}` : ''}
          </p>
        </div>
        <Link href="/categories/new" className="admin-btn">
          <Plus size={16} /> Nouvelle catégorie
        </Link>
      </div>

      <div className="admin-card mb-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="admin-label">Recherche</label>
          <input
            className="admin-input"
            placeholder="Nom, slug…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-40">
          <label className="admin-label">Statut</label>
          <select className="admin-input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Tous</option>
            <option value="true">Actives</option>
            <option value="false">Inactives</option>
          </select>
        </div>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <div className="admin-card overflow-x-auto !p-0">
        {loading ? (
          <p className="text-center py-10 text-[var(--admin-muted)]">Chargement…</p>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <p className="text-[var(--admin-muted)]">Aucune catégorie</p>
            <Link href="/categories/new" className="admin-btn inline-flex">
              <Plus size={16} /> Créer la première
            </Link>
          </div>
        ) : (
          <table className="admin-table w-full text-sm">
            <thead>
              <tr className="px-5">
                <th className="pl-5">Catégorie</th>
                <th>Slug</th>
                <th>Parent</th>
                <th>Produits</th>
                <th>Sous-cat.</th>
                <th>Ordre</th>
                <th>Statut</th>
                <th className="pr-5" />
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-black/[0.015]">
                  <td className="pl-5">
                    <div className="flex items-center gap-3 min-w-[180px]">
                      <div className="w-11 h-11 rounded-md overflow-hidden border border-[var(--admin-line)] bg-black/[0.03] shrink-0">
                        {categoryImageSrc(c.imageUrl, c.slug) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={categoryImageSrc(c.imageUrl, c.slug)}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-[var(--admin-muted)]">
                            —
                          </div>
                        )}
                      </div>
                      <div>
                        <Link
                          href={`/categories/${c.id}`}
                          className="font-medium hover:text-[var(--admin-rose)]"
                        >
                          {c.nameFr}
                        </Link>
                        {c.nameEn && (
                          <p className="text-[11px] text-[var(--admin-muted)]">{c.nameEn}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="font-mono text-xs text-[var(--admin-muted)]">{c.slug}</td>
                  <td>{c.parent?.nameFr ?? '—'}</td>
                  <td>
                    {(c._count?.products ?? 0) > 0 ? (
                      <Link
                        href={`/products?categoryId=${c.id}`}
                        className="text-[var(--admin-rose)] hover:underline"
                      >
                        {c._count?.products}
                      </Link>
                    ) : (
                      0
                    )}
                  </td>
                  <td>{c._count?.children ?? 0}</td>
                  <td>
                    <div className="flex items-center gap-0.5">
                      <span className="w-6 text-center">{c.sortOrder}</span>
                      <button
                        type="button"
                        title="Monter"
                        className="admin-btn-ghost px-1"
                        onClick={() => void bumpOrder(c, -1)}
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        type="button"
                        title="Descendre"
                        className="admin-btn-ghost px-1"
                        onClick={() => void bumpOrder(c, 1)}
                      >
                        <ArrowDown size={13} />
                      </button>
                    </div>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => void toggleActive(c)}
                      className={c.isActive ? 'admin-badge-ok' : 'admin-badge-black'}
                      title={c.isActive ? 'Désactiver' : 'Activer'}
                    >
                      {c.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="pr-5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => void toggleActive(c)}
                      className="admin-btn-ghost"
                      title={c.isActive ? 'Masquer' : 'Afficher'}
                    >
                      {c.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <Link href={`/categories/${c.id}`} className="admin-btn-ghost inline-flex">
                      <Pencil size={14} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => void remove(c.id)}
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
