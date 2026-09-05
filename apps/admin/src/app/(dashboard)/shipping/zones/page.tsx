'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { adminAlert, adminConfirm } from '@/lib/admin-dialog';
import { formatPrice } from '@/lib/utils';

type Zone = {
  id: string;
  name: string;
  cities: string[];
  regions: string[];
  price: number;
  freeAbove?: number | null;
  isActive: boolean;
};

export default function ShippingZonesPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (search.trim()) qs.set('search', search.trim());
      if (status) qs.set('isActive', status);
      const data = await adminApi<Zone[]>(
        `/admin/shipping/zones${qs.toString() ? `?${qs}` : ''}`,
      );
      setZones(Array.isArray(data) ? data : []);
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
    if (!(await adminConfirm('Supprimer cette zone ?'))) return;
    try {
      await adminApi(`/admin/shipping/zones/${id}`, { method: 'DELETE' });
      void load();
    } catch (err) {
      await adminAlert({ message: err instanceof Error ? err.message : 'Erreur', variant: 'error' });
    }
  }

  async function toggle(z: Zone) {
    try {
      await adminApi(`/admin/shipping/zones/${z.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !z.isActive }),
      });
      void load();
    } catch (err) {
      await adminAlert({ message: err instanceof Error ? err.message : 'Erreur', variant: 'error' });
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
            <h1 className="text-xl font-semibold">Zones & tarifs</h1>
            <p className="text-sm text-[var(--admin-muted)] mt-0.5">
              {zones.length} zone{zones.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Link href="/shipping/zones/new" className="admin-btn">
          <Plus size={16} /> Nouvelle zone
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
              placeholder="Nom ou ville…"
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
        ) : zones.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <p className="text-[var(--admin-muted)]">Aucune zone</p>
            <Link href="/shipping/zones/new" className="admin-btn inline-flex">
              <Plus size={16} /> Créer la première
            </Link>
          </div>
        ) : (
          <table className="admin-table w-full text-sm">
            <thead>
              <tr>
                <th className="pl-5">Zone</th>
                <th>Villes</th>
                <th>Prix</th>
                <th>Gratuit dès</th>
                <th>Statut</th>
                <th className="pr-5" />
              </tr>
            </thead>
            <tbody>
              {zones.map((z) => (
                <tr key={z.id} className="hover:bg-black/[0.015]">
                  <td className="pl-5">
                    <Link
                      href={`/shipping/zones/${z.id}`}
                      className="font-medium hover:text-[var(--admin-rose)]"
                    >
                      {z.name}
                    </Link>
                    {z.regions.length > 0 && (
                      <p className="text-[11px] text-[var(--admin-muted)] truncate max-w-[180px]">
                        {z.regions.join(', ')}
                      </p>
                    )}
                  </td>
                  <td className="text-[var(--admin-muted)] max-w-[240px]">
                    <span className="line-clamp-2">
                      {z.cities.length ? z.cities.join(', ') : 'Fallback national'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap">{formatPrice(z.price)}</td>
                  <td className="whitespace-nowrap">
                    {z.freeAbove != null ? formatPrice(z.freeAbove) : '—'}
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => void toggle(z)}
                      className={z.isActive ? 'admin-badge-ok' : 'admin-badge-black'}
                    >
                      {z.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="pr-5 text-right whitespace-nowrap">
                    <Link href={`/shipping/zones/${z.id}`} className="admin-btn-ghost inline-flex">
                      <Pencil size={14} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => void remove(z.id)}
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
