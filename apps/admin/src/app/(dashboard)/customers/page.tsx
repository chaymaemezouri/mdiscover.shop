'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, Search, ShieldBan, ShieldCheck } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { adminAlert, adminConfirm } from '@/lib/admin-dialog';
import { formatPrice } from '@/lib/utils';

type CustomerRow = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  status: string;
  locale?: string;
  emailVerified?: boolean;
  createdAt: string;
  orderCount: number;
  addressCount?: number;
  wishlistCount?: number;
  totalSpent: number;
};

type Meta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  counts?: Record<string, number>;
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Actif',
  BLOCKED: 'Bloqué',
  DELETED: 'Supprimé',
};

function customerName(c: CustomerRow) {
  return [c.firstName, c.lastName].filter(Boolean).join(' ') || '—';
}

function statusBadge(status: string) {
  if (status === 'BLOCKED') return 'bg-red-50 text-red-700';
  if (status === 'DELETED') return 'admin-badge-black';
  return 'admin-badge-ok';
}

function CustomersListInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: 30, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(searchParams.get('status') ?? '');
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) router.replace(`/customers/${id}`);
  }, [searchParams, router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: '30' });
      if (search.trim()) qs.set('search', search.trim());
      if (status) qs.set('status', status);
      const res = await adminApi<{ data: CustomerRow[]; meta: Meta }>(`/admin/customers?${qs}`);
      setCustomers(res.data ?? []);
      setMeta(res.meta ?? { total: 0, page: 1, limit: 30, totalPages: 1 });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    const t = setTimeout(() => void load(), search ? 280 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  async function toggleBlock(c: CustomerRow) {
    const endpoint = c.status === 'BLOCKED' ? 'unblock' : 'block';
    if (
      !(await adminConfirm({
        title: c.status === 'BLOCKED' ? 'Débloquer le client' : 'Bloquer le client',
        message:
          c.status === 'BLOCKED'
            ? `Débloquer ${c.email} ?`
            : `Bloquer ${c.email} ? Il ne pourra plus se connecter.`,
        confirmLabel: c.status === 'BLOCKED' ? 'Débloquer' : 'Bloquer',
        danger: c.status !== 'BLOCKED',
      }))
    ) {
      return;
    }
    setBusyId(c.id);
    try {
      await adminApi(`/admin/customers/${c.id}/${endpoint}`, { method: 'PUT' });
      void load();
    } catch (err) {
      await adminAlert({ message: err instanceof Error ? err.message : 'Erreur', variant: 'error' });
    } finally {
      setBusyId(null);
    }
  }

  const totalAll = meta.counts
    ? Object.values(meta.counts).reduce((a, b) => a + b, 0)
    : meta.total;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Clients</h1>
          <p className="text-sm text-[var(--admin-muted)] mt-0.5">
            {meta.total} résultat{meta.total > 1 ? 's' : ''}
            {totalAll ? ` · ${totalAll} au total` : ''}
          </p>
        </div>
      </div>

      <div className="flex gap-1.5 mb-4 flex-wrap">
        <button
          type="button"
          onClick={() => setStatus('')}
          className={!status ? 'admin-btn-black text-xs py-1.5 px-3' : 'admin-btn-outline text-xs py-1.5 px-3'}
        >
          Tous{totalAll ? ` (${totalAll})` : ''}
        </button>
        {(['ACTIVE', 'BLOCKED'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={
              status === s ? 'admin-btn text-xs py-1.5 px-3' : 'admin-btn-outline text-xs py-1.5 px-3'
            }
          >
            {STATUS_LABELS[s]}
            {meta.counts?.[s] != null ? ` (${meta.counts[s]})` : ''}
          </button>
        ))}
      </div>

      <div className="admin-card mb-4">
        <label className="admin-label">Recherche</label>
        <div className="relative max-w-md">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-muted)]"
          />
          <input
            type="search"
            className="admin-input pl-9"
            placeholder="Email, nom, téléphone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-card overflow-x-auto !p-0">
        {loading ? (
          <p className="text-center py-10 text-[var(--admin-muted)]">Chargement…</p>
        ) : customers.length === 0 ? (
          <p className="text-center py-12 text-[var(--admin-muted)]">Aucun client</p>
        ) : (
          <table className="admin-table w-full text-sm">
            <thead>
              <tr>
                <th className="pl-5">Client</th>
                <th>Contact</th>
                <th>Commandes</th>
                <th>Dépensé</th>
                <th>Statut</th>
                <th>Inscrit</th>
                <th className="pr-5" />
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-black/[0.015]">
                  <td className="pl-5">
                    <Link
                      href={`/customers/${c.id}`}
                      className="font-medium hover:text-[var(--admin-rose)]"
                    >
                      {customerName(c)}
                    </Link>
                    {c.emailVerified && (
                      <p className="text-[10px] text-emerald-600 mt-0.5">Email vérifié</p>
                    )}
                  </td>
                  <td>
                    <p>{c.email}</p>
                    {c.phone && (
                      <p className="text-[11px] text-[var(--admin-muted)]">{c.phone}</p>
                    )}
                  </td>
                  <td className="tabular-nums">{c.orderCount}</td>
                  <td className="tabular-nums font-medium">{formatPrice(c.totalSpent)}</td>
                  <td>
                    <span className={`admin-badge ${statusBadge(c.status)}`}>
                      {STATUS_LABELS[c.status] ?? c.status}
                    </span>
                  </td>
                  <td className="text-[var(--admin-muted)] whitespace-nowrap">
                    {new Date(c.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="pr-5 text-right whitespace-nowrap">
                    <Link href={`/customers/${c.id}`} className="admin-btn-ghost inline-flex" title="Voir">
                      <Eye size={15} />
                    </Link>
                    <button
                      type="button"
                      disabled={busyId === c.id}
                      onClick={() => void toggleBlock(c)}
                      className="admin-btn-ghost inline-flex"
                      title={c.status === 'BLOCKED' ? 'Débloquer' : 'Bloquer'}
                    >
                      {c.status === 'BLOCKED' ? <ShieldCheck size={15} /> : <ShieldBan size={15} />}
                    </button>
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

export default function CustomersAdminPage() {
  return (
    <Suspense fallback={<p className="text-sm text-[var(--admin-muted)]">Chargement…</p>}>
      <CustomersListInner />
    </Suspense>
  );
}
