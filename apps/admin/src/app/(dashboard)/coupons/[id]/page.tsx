'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Pencil,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { adminConfirm } from '@/lib/admin-dialog';
import { formatPrice } from '@/lib/utils';
import { ORDER_STATUS_LABELS, orderStatusBadgeClass } from '@/lib/orders';

type CouponDetail = {
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
  categoryIds: string[];
  createdAt: string;
  orderCount?: number;
  categories?: { id: string; nameFr: string; slug: string }[];
  orders?: {
    id: string;
    orderNumber: string;
    total: number;
    status: string;
    discount: number;
    createdAt: string;
    guestEmail?: string | null;
    user?: { email: string; firstName?: string | null; lastName?: string | null } | null;
  }[];
};

const TYPE_LABELS: Record<string, string> = {
  PERCENTAGE: 'Pourcentage',
  FIXED: 'Montant fixe',
  FREE_SHIPPING: 'Livraison offerte',
};

function formatValue(c: CouponDetail) {
  if (c.type === 'PERCENTAGE') return `${c.value}%`;
  if (c.type === 'FREE_SHIPPING') return 'Livraison offerte';
  return formatPrice(c.value);
}

export default function CouponDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [coupon, setCoupon] = useState<CouponDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!params.id) return;
    setLoading(true);
    setError('');
    try {
      const data = await adminApi<CouponDetail>(`/admin/coupons/${params.id}`);
      setCoupon(data);
    } catch {
      setError('Coupon introuvable');
      setCoupon(null);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggle() {
    if (!coupon) return;
    setBusy(true);
    setMsg('');
    try {
      await adminApi(`/admin/coupons/${coupon.id}/toggle`, { method: 'PUT' });
      setMsg(coupon.isActive ? 'Coupon désactivé' : 'Coupon activé');
      void load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!coupon) return;
    if (!(await adminConfirm(`Supprimer le coupon ${coupon.code} ?`))) return;
    setBusy(true);
    try {
      await adminApi(`/admin/coupons/${coupon.id}`, { method: 'DELETE' });
      router.push('/coupons');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Erreur');
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-[var(--admin-muted)] py-10">Chargement…</p>;
  }

  if (error || !coupon) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600">{error || 'Erreur'}</p>
        <Link href="/coupons" className="admin-btn-outline">
          Retour aux coupons
        </Link>
      </div>
    );
  }

  const expired = Boolean(coupon.expiresAt && new Date(coupon.expiresAt) < new Date());

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Link href="/coupons" className="admin-btn-ghost mt-0.5">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold font-mono tracking-wide">{coupon.code}</h1>
              <span className={coupon.isActive && !expired ? 'admin-badge-ok' : 'admin-badge-black'}>
                {expired ? 'Expiré' : coupon.isActive ? 'Actif' : 'Inactif'}
              </span>
            </div>
            <p className="text-sm text-[var(--admin-muted)] mt-0.5">
              {TYPE_LABELS[coupon.type] ?? coupon.type} · {formatValue(coupon)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void load()} className="admin-btn-ghost">
            <RefreshCw size={15} />
          </button>
          <Link href={`/coupons/${coupon.id}/edit`} className="admin-btn-outline">
            <Pencil size={15} /> Modifier
          </Link>
          <button type="button" disabled={busy} onClick={() => void toggle()} className="admin-btn">
            {coupon.isActive ? 'Désactiver' : 'Activer'}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void remove()}
            className="admin-btn-ghost text-red-600"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {msg && (
        <p className="text-sm bg-[var(--admin-rose-soft)] text-[var(--admin-rose)] border border-[var(--admin-line)] rounded-md px-3 py-2">
          {msg}
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Valeur', value: formatValue(coupon) },
          {
            label: 'Utilisations',
            value: `${coupon.usedCount}${coupon.maxUses != null ? ` / ${coupon.maxUses}` : ''}`,
          },
          {
            label: 'Min. commande',
            value: coupon.minOrderAmount != null ? formatPrice(coupon.minOrderAmount) : '—',
          },
          { label: 'Commandes liées', value: String(coupon.orderCount ?? coupon.orders?.length ?? 0) },
        ].map((s) => (
          <div key={s.label} className="admin-stat">
            <p className="text-xs text-[var(--admin-muted)]">{s.label}</p>
            <p className="text-lg font-semibold tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_1fr] gap-5">
        <section className="admin-card space-y-3">
          <h2 className="text-sm font-semibold">Commandes avec ce code</h2>
          {(coupon.orders?.length ?? 0) === 0 ? (
            <p className="text-sm text-[var(--admin-muted)]">Pas encore utilisé</p>
          ) : (
            <div className="divide-y divide-[var(--admin-line)]">
              {coupon.orders!.map((o) => (
                <Link
                  key={o.id}
                  href={`/orders/${o.id}`}
                  className="py-3 flex flex-wrap items-center justify-between gap-2 hover:bg-black/[0.02] -mx-2 px-2 rounded-md"
                >
                  <div>
                    <p className="font-medium text-sm">{o.orderNumber}</p>
                    <p className="text-[11px] text-[var(--admin-muted)]">
                      {o.user?.email ?? o.guestEmail ?? '—'} ·{' '}
                      {new Date(o.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="tabular-nums text-sm font-medium">{formatPrice(o.total)}</p>
                    {o.discount > 0 && (
                      <p className="text-[11px] text-[var(--admin-muted)]">
                        −{formatPrice(o.discount)}
                      </p>
                    )}
                    <span className={`mt-1 inline-flex ${orderStatusBadgeClass(o.status)}`}>
                      {ORDER_STATUS_LABELS[o.status] ?? o.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <div className="space-y-5">
          <section className="admin-card space-y-2 text-sm">
            <h2 className="text-sm font-semibold">Détails</h2>
            <div className="flex justify-between gap-2">
              <span className="text-[var(--admin-muted)]">Type</span>
              <span>{TYPE_LABELS[coupon.type] ?? coupon.type}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-[var(--admin-muted)]">Début</span>
              <span>
                {coupon.startsAt
                  ? new Date(coupon.startsAt).toLocaleDateString('fr-FR')
                  : '—'}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-[var(--admin-muted)]">Expiration</span>
              <span className={expired ? 'text-red-600' : ''}>
                {coupon.expiresAt
                  ? new Date(coupon.expiresAt).toLocaleDateString('fr-FR')
                  : '—'}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-[var(--admin-muted)]">Créé le</span>
              <span>{new Date(coupon.createdAt).toLocaleString('fr-FR')}</span>
            </div>
          </section>

          <section className="admin-card space-y-2">
            <h2 className="text-sm font-semibold">Catégories ciblées</h2>
            {(coupon.categories?.length ?? 0) === 0 ? (
              <p className="text-sm text-[var(--admin-muted)]">Tout le catalogue</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {coupon.categories!.map((c) => (
                  <span key={c.id} className="admin-badge-rose">
                    {c.nameFr}
                  </span>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
