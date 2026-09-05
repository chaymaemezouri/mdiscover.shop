'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { adminAlert, adminConfirm } from '@/lib/admin-dialog';
import { formatPrice } from '@/lib/utils';

type CouponRow = {
  id: string;
  code: string;
  type: string;
  value: number;
  isActive: boolean;
  usedCount: number;
  maxUses?: number | null;
  minOrderAmount?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  orderCount?: number;
};

type Meta = {
  total: number;
  counts?: { ACTIVE?: number; INACTIVE?: number };
};

const TYPE_LABELS: Record<string, string> = {
  PERCENTAGE: 'Pourcentage',
  FIXED: 'Montant fixe',
  FREE_SHIPPING: 'Livraison',
};

function formatValue(c: CouponRow) {
  if (c.type === 'PERCENTAGE') return `${c.value}%`;
  if (c.type === 'FREE_SHIPPING') return 'Offerte';
  return formatPrice(c.value);
}

function isExpired(c: CouponRow) {
  return Boolean(c.expiresAt && new Date(c.expiresAt) < new Date());
}

function CouponsListInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');

  useEffect(() => {
    if (searchParams.get('new') === '1') router.replace('/coupons/new');
  }, [searchParams, router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (search.trim()) qs.set('search', search.trim());
      if (status) qs.set('isActive', status);
      if (type) qs.set('type', type);
      const res = await adminApi<{ data: CouponRow[]; meta: Meta } | CouponRow[]>(
        `/admin/coupons${qs.toString() ? `?${qs}` : ''}`,
      );
      if (Array.isArray(res)) {
        setCoupons(res);
        setMeta({ total: res.length });
      } else {
        setCoupons(res.data ?? []);
        setMeta(res.meta ?? { total: res.data?.length ?? 0 });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, status, type]);

  useEffect(() => {
    const t = setTimeout(() => void load(), search ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  async function toggle(id: string) {
    await adminApi(`/admin/coupons/${id}/toggle`, { method: 'PUT' });
    void load();
  }

  async function remove(id: string) {
    if (!(await adminConfirm('Supprimer ce coupon ?'))) return;
    try {
      await adminApi(`/admin/coupons/${id}`, { method: 'DELETE' });
      void load();
    } catch (err) {
      await adminAlert({ message: err instanceof Error ? err.message : 'Erreur', variant: 'error' });
    }
  }

  const activeCount = meta.counts?.ACTIVE;
  const inactiveCount = meta.counts?.INACTIVE;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Promotions & Coupons</h1>
          <p className="text-sm text-[var(--admin-muted)] mt-0.5">
            {coupons.length} code{coupons.length > 1 ? 's' : ''}
            {activeCount != null ? ` · ${activeCount} actif${activeCount > 1 ? 's' : ''}` : ''}
          </p>
        </div>
        <Link href="/coupons/new" className="admin-btn">
          <Plus size={16} /> Nouveau coupon
        </Link>
      </div>

      <div className="flex gap-1.5 mb-4 flex-wrap">
        <button
          type="button"
          onClick={() => setStatus('')}
          className={!status ? 'admin-btn-black text-xs py-1.5 px-3' : 'admin-btn-outline text-xs py-1.5 px-3'}
        >
          Tous
        </button>
        <button
          type="button"
          onClick={() => setStatus('true')}
          className={
            status === 'true' ? 'admin-btn text-xs py-1.5 px-3' : 'admin-btn-outline text-xs py-1.5 px-3'
          }
        >
          Actifs{activeCount != null ? ` (${activeCount})` : ''}
        </button>
        <button
          type="button"
          onClick={() => setStatus('false')}
          className={
            status === 'false' ? 'admin-btn text-xs py-1.5 px-3' : 'admin-btn-outline text-xs py-1.5 px-3'
          }
        >
          Inactifs{inactiveCount != null ? ` (${inactiveCount})` : ''}
        </button>
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
              className="admin-input pl-9 uppercase"
              placeholder="Code…"
              value={search}
              onChange={(e) => setSearch(e.target.value.toUpperCase())}
            />
          </div>
        </div>
        <div className="w-44">
          <label className="admin-label">Type</label>
          <select className="admin-input" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Tous</option>
            <option value="PERCENTAGE">Pourcentage</option>
            <option value="FIXED">Montant fixe</option>
            <option value="FREE_SHIPPING">Livraison</option>
          </select>
        </div>
      </div>

      <div className="admin-card overflow-x-auto !p-0">
        {loading ? (
          <p className="text-center py-10 text-[var(--admin-muted)]">Chargement…</p>
        ) : coupons.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <p className="text-[var(--admin-muted)]">Aucun coupon</p>
            <Link href="/coupons/new" className="admin-btn inline-flex">
              <Plus size={16} /> Créer le premier
            </Link>
          </div>
        ) : (
          <table className="admin-table w-full text-sm">
            <thead>
              <tr>
                <th className="pl-5">Code</th>
                <th>Type</th>
                <th>Valeur</th>
                <th>Min.</th>
                <th>Utilisations</th>
                <th>Expire</th>
                <th>Statut</th>
                <th className="pr-5" />
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-black/[0.015]">
                  <td className="pl-5">
                    <Link
                      href={`/coupons/${c.id}`}
                      className="font-mono font-medium hover:text-[var(--admin-rose)]"
                    >
                      {c.code}
                    </Link>
                  </td>
                  <td>{TYPE_LABELS[c.type] ?? c.type}</td>
                  <td className="tabular-nums font-medium">{formatValue(c)}</td>
                  <td>
                    {c.minOrderAmount != null ? formatPrice(c.minOrderAmount) : '—'}
                  </td>
                  <td className="tabular-nums">
                    {c.usedCount}
                    {c.maxUses != null ? ` / ${c.maxUses}` : ''}
                  </td>
                  <td className="text-[var(--admin-muted)]">
                    {c.expiresAt ? (
                      <span className={isExpired(c) ? 'text-red-600' : ''}>
                        {new Date(c.expiresAt).toLocaleDateString('fr-FR')}
                        {isExpired(c) ? ' · expiré' : ''}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => void toggle(c.id)}
                      className={c.isActive && !isExpired(c) ? 'admin-badge-ok' : 'admin-badge-black'}
                    >
                      {c.isActive ? 'Actif' : 'Inactif'}
                    </button>
                  </td>
                  <td className="pr-5 text-right whitespace-nowrap">
                    <Link href={`/coupons/${c.id}`} className="admin-btn-ghost inline-flex" title="Voir">
                      <Eye size={14} />
                    </Link>
                    <Link
                      href={`/coupons/${c.id}/edit`}
                      className="admin-btn-ghost inline-flex"
                      title="Modifier"
                    >
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

export default function CouponsAdminPage() {
  return (
    <Suspense fallback={<p className="text-sm text-[var(--admin-muted)]">Chargement…</p>}>
      <CouponsListInner />
    </Suspense>
  );
}
