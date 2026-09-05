'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, Search } from 'lucide-react';
import { adminApi, type AdminOrder } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  orderStatusBadgeClass,
  paymentStatusLabel,
} from '@/lib/orders';

type OrdersMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  counts?: Record<string, number>;
};

function customerLabel(o: AdminOrder) {
  if (o.user) {
    const name = [o.user.firstName, o.user.lastName].filter(Boolean).join(' ');
    return name || o.user.email;
  }
  return o.guestEmail ?? 'Invité';
}

function OrdersListInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [meta, setMeta] = useState<OrdersMeta>({ total: 0, page: 1, limit: 30, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [status, setStatus] = useState(searchParams.get('status') ?? '');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) router.replace(`/orders/${id}`);
    const q = searchParams.get('search');
    if (q) setSearch(q);
  }, [searchParams, router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: '30' });
      if (status) qs.set('status', status);
      if (search.trim()) qs.set('search', search.trim());
      if (paymentMethod) qs.set('paymentMethod', paymentMethod);
      const res = await adminApi<{ data: AdminOrder[]; meta: OrdersMeta }>(
        `/admin/orders?${qs}`,
      );
      setOrders(res.data ?? []);
      setMeta(res.meta ?? { total: 0, page: 1, limit: 30, totalPages: 1 });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, status, search, paymentMethod]);

  useEffect(() => {
    const t = setTimeout(() => void load(), search ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  useEffect(() => {
    setPage(1);
  }, [status, paymentMethod, search]);

  const totalAll =
    meta.counts
      ? Object.values(meta.counts).reduce((a, b) => a + b, 0)
      : meta.total;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Commandes</h1>
          <p className="text-sm text-[var(--admin-muted)] mt-0.5">
            {meta.total} résultat{meta.total > 1 ? 's' : ''}
            {totalAll ? ` · ${totalAll} au total` : ''}
          </p>
        </div>
      </div>

      {/* Status chips with counts */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        <button
          type="button"
          onClick={() => setStatus('')}
          className={!status ? 'admin-btn-black text-xs py-1.5 px-3' : 'admin-btn-outline text-xs py-1.5 px-3'}
        >
          Toutes{totalAll ? ` (${totalAll})` : ''}
        </button>
        {ORDER_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={
              status === s ? 'admin-btn text-xs py-1.5 px-3' : 'admin-btn-outline text-xs py-1.5 px-3'
            }
          >
            {ORDER_STATUS_LABELS[s]}
            {meta.counts?.[s] != null ? ` (${meta.counts[s]})` : ''}
          </button>
        ))}
      </div>

      <div className="admin-card mb-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[220px]">
          <label className="admin-label">Recherche</label>
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-muted)]"
            />
            <input
              className="admin-input pl-9"
              placeholder="N° commande, email, suivi…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="w-44">
          <label className="admin-label">Paiement</label>
          <select
            className="admin-input"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="">Tous</option>
            <option value="COD">Paiement à la livraison</option>
            <option value="STRIPE">Carte (Stripe)</option>
          </select>
        </div>
      </div>

      <div className="admin-card overflow-x-auto !p-0">
        {loading ? (
          <p className="text-center py-10 text-[var(--admin-muted)]">Chargement…</p>
        ) : orders.length === 0 ? (
          <p className="text-center py-12 text-[var(--admin-muted)]">Aucune commande</p>
        ) : (
          <table className="admin-table w-full text-sm">
            <thead>
              <tr>
                <th className="pl-5">N°</th>
                <th>Client</th>
                <th>Articles</th>
                <th>Total</th>
                <th>Paiement</th>
                <th>Statut</th>
                <th>Date</th>
                <th className="pr-5" />
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-black/[0.015]">
                  <td className="pl-5">
                    <Link
                      href={`/orders/${o.id}`}
                      className="font-medium hover:text-[var(--admin-rose)]"
                    >
                      {o.orderNumber}
                    </Link>
                    {o.shipment?.trackingNumber && (
                      <p className="text-[11px] text-[var(--admin-muted)] font-mono mt-0.5">
                        {o.shipment.trackingNumber}
                      </p>
                    )}
                  </td>
                  <td>
                    <p className="font-medium">{customerLabel(o)}</p>
                    <p className="text-[11px] text-[var(--admin-muted)]">
                      {o.user?.email ?? o.guestEmail ?? '—'}
                    </p>
                  </td>
                  <td className="tabular-nums">{o.items?.length ?? 0}</td>
                  <td className="tabular-nums font-medium">{formatPrice(o.total)}</td>
                  <td>
                    <p>{o.payment?.method === 'COD' ? 'COD' : o.payment?.method ?? '—'}</p>
                    <p className="text-[11px] text-[var(--admin-muted)]">
                      {paymentStatusLabel(o.payment?.status)}
                    </p>
                  </td>
                  <td>
                    <span className={orderStatusBadgeClass(o.status)}>
                      {ORDER_STATUS_LABELS[o.status] ?? o.status}
                    </span>
                  </td>
                  <td className="text-[var(--admin-muted)] whitespace-nowrap">
                    {new Date(o.createdAt).toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="pr-5 text-right">
                    <Link href={`/orders/${o.id}`} className="admin-btn-ghost inline-flex" title="Détails">
                      <Eye size={15} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {meta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="admin-btn-outline disabled:opacity-40"
          >
            Précédent
          </button>
          <span className="text-xs text-[var(--admin-muted)]">
            Page {meta.page} / {meta.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="admin-btn-outline disabled:opacity-40"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}

export default function OrdersAdminPage() {
  return (
    <Suspense fallback={<p className="text-sm text-[var(--admin-muted)]">Chargement…</p>}>
      <OrdersListInner />
    </Suspense>
  );
}
