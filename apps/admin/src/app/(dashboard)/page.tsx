'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Package,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  Plus,
  Tag,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

type LowStockItem = {
  id: string;
  sku: string;
  stock: number;
  name?: string;
  product: { id: string; nameFr: string; slug: string };
};

type DashboardStats = {
  orders: { total: number; today: number; thisMonth: number };
  revenue: { thisMonth: number; avgOrderValue: number };
  alerts: { lowStock: LowStockItem[]; pendingReviews: number };
  recentOrders: {
    id: string;
    orderNumber: string;
    total: number;
    status: string;
    createdAt: string;
  }[];
};

type Analytics = {
  period: { days: number };
  summary: { totalOrders: number; totalRevenue: number };
  dailyRevenue: { date: string; revenue: number }[];
};

const EMPTY: DashboardStats = {
  orders: { total: 0, today: 0, thisMonth: 0 },
  revenue: { thisMonth: 0, avgOrderValue: 0 },
  alerts: { lowStock: [], pendingReviews: 0 },
  recentOrders: [],
};

const PERIODS = [
  { days: 7, label: '7 j' },
  { days: 30, label: '30 j' },
  { days: 90, label: '90 j' },
] as const;

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>(EMPTY);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      adminApi<DashboardStats>('/admin/dashboard'),
      adminApi<Analytics>(`/admin/analytics?days=${days}`),
    ])
      .then(([dash, anal]) => {
        setStats(dash);
        setAnalytics(anal);
      })
      .catch(() => {
        setStats(EMPTY);
        setAnalytics(null);
      })
      .finally(() => setLoading(false));
  }, [days]);

  const maxRevenue = useMemo(() => {
    if (!analytics?.dailyRevenue.length) return 1;
    return Math.max(1, ...analytics.dailyRevenue.map((d) => d.revenue));
  }, [analytics]);

  const storeUrl = process.env.NEXT_PUBLIC_STORE_URL ?? 'http://localhost:3000';

  return (
    <div className="min-w-0">
      <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-[var(--admin-black)]">Dashboard</h1>
          <p className="mt-0.5 text-sm text-[var(--admin-muted)]">Vue d&apos;ensemble mDISCOVER</p>
        </div>
        <div className="flex w-full items-center gap-1 rounded-md border border-[var(--admin-line)] bg-white p-1 sm:w-auto">
          {PERIODS.map((p) => (
            <button
              key={p.days}
              type="button"
              onClick={() => setDays(p.days)}
              className={
                days === p.days
                  ? 'admin-btn flex-1 text-xs py-1.5 px-3 sm:flex-none'
                  : 'admin-btn-ghost flex-1 text-xs py-1.5 px-3 sm:flex-none'
              }
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:flex-wrap">
        <Link href="/products/new" className="admin-btn text-xs w-full sm:w-auto justify-center">
          <Plus size={14} /> Nouveau produit
        </Link>
        <Link href="/coupons/new" className="admin-btn-black text-xs w-full sm:w-auto justify-center">
          <Tag size={14} /> Nouvelle promo
        </Link>
        <a
          href={storeUrl}
          target="_blank"
          rel="noreferrer"
          className="admin-btn-outline text-xs w-full sm:w-auto justify-center"
        >
          Voir le site
          <ExternalLink size={12} />
        </a>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--admin-muted)] py-10">Chargement…</p>
      ) : (
        <>
          <div className="mb-5 grid grid-cols-1 gap-3 sm:mb-6 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={ShoppingCart}
              label="Commandes aujourd'hui"
              value={String(stats.orders.today)}
              sub={`${stats.orders.thisMonth} ce mois · ${stats.orders.total} total`}
              href="/orders"
            />
            <StatCard
              icon={TrendingUp}
              label={`CA ${days} j`}
              value={formatPrice(analytics?.summary.totalRevenue ?? stats.revenue.thisMonth)}
              sub={`${analytics?.summary.totalOrders ?? 0} commandes · panier moy. ${formatPrice(stats.revenue.avgOrderValue)}`}
              href="/orders"
            />
            <StatCard
              icon={Package}
              label="Stock faible"
              value={String(stats.alerts.lowStock.length)}
              sub="À réapprovisionner"
              alert={stats.alerts.lowStock.length > 0}
              href="/products?lowStock=1"
            />
            <StatCard
              icon={AlertTriangle}
              label="Avis en attente"
              value={String(stats.alerts.pendingReviews)}
              sub="Modération"
              alert={stats.alerts.pendingReviews > 0}
              href="/reviews"
            />
          </div>

          <div className="admin-card mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold">CA — {days} derniers jours</h2>
            </div>
            {analytics?.dailyRevenue.length ? (
              <div className="flex items-end gap-1 h-28">
                {analytics.dailyRevenue.map((d) => {
                  const h = Math.max(2, Math.round((d.revenue / maxRevenue) * 100));
                  return (
                    <div
                      key={d.date}
                      className="flex-1 min-w-0 group relative flex flex-col justify-end h-full"
                      title={`${d.date}: ${formatPrice(d.revenue)}`}
                    >
                      <div
                        className="w-full rounded-t bg-[var(--admin-rose)]/80 hover:bg-[var(--admin-rose)] transition-colors"
                        style={{ height: `${h}%` }}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-[var(--admin-muted)] py-8 text-center">Pas encore de CA</p>
            )}
            <div className="mt-2 flex justify-between text-[10px] text-[var(--admin-muted)]">
              <span>{analytics?.dailyRevenue[0]?.date?.slice(5) ?? '—'}</span>
              <span>
                {analytics?.dailyRevenue[analytics.dailyRevenue.length - 1]?.date?.slice(5) ?? '—'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
            <div className="admin-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold">Dernières commandes</h2>
                <Link href="/orders" className="text-xs text-[var(--admin-rose)] hover:underline">
                  Voir tout
                </Link>
              </div>
              {stats.recentOrders.length === 0 ? (
                <p className="text-sm text-[var(--admin-muted)] py-8 text-center">
                  Aucune commande pour le moment.
                </p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table text-sm">
                    <thead>
                      <tr>
                        <th>N°</th>
                        <th>Total</th>
                        <th>Statut</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-black/[0.02]">
                          <td>
                            <Link
                              href={`/orders/${order.id}`}
                              className="font-medium text-[var(--admin-rose)] hover:underline"
                            >
                              {order.orderNumber}
                            </Link>
                          </td>
                          <td>{formatPrice(order.total)}</td>
                          <td>
                            <span className="admin-badge-rose">{order.status}</span>
                          </td>
                          <td className="text-[var(--admin-muted)]">
                            {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="admin-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold">Alertes stock faible</h2>
                <Link
                  href="/products?lowStock=1"
                  className="text-xs text-[var(--admin-rose)] hover:underline"
                >
                  Produits
                </Link>
              </div>
              {stats.alerts.lowStock.length === 0 ? (
                <p className="text-sm text-[var(--admin-muted)] py-8 text-center">
                  Aucun SKU en stock faible.
                </p>
              ) : (
                <ul className="divide-y divide-[var(--admin-line)]">
                  {stats.alerts.lowStock.map((v) => (
                    <li key={v.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <Link
                          href={`/products/${v.product.id}`}
                          className="font-medium hover:text-[var(--admin-rose)] truncate block"
                        >
                          {v.product.nameFr}
                        </Link>
                        <p className="text-xs text-[var(--admin-muted)] font-mono">
                          {v.sku}
                          {v.name ? ` · ${v.name}` : ''}
                        </p>
                      </div>
                      <span
                        className={
                          v.stock <= 0
                            ? 'admin-badge bg-red-50 text-red-700'
                            : 'admin-badge-rose'
                        }
                      >
                        {v.stock} u.
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  alert,
  href,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  sub: string;
  alert?: boolean;
  href?: string;
}) {
  const inner = (
    <>
      <Icon size={18} className={alert ? 'text-[var(--admin-rose)]' : 'text-[var(--admin-muted)]'} />
      <p className="mt-2 text-xl font-semibold tabular-nums break-all">{value}</p>
      <p className="text-sm font-medium leading-snug">{label}</p>
      <p className="truncate text-xs text-[var(--admin-muted)]" title={sub}>
        {sub}
      </p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="admin-stat hover:border-[var(--admin-rose)] transition-colors">
        {inner}
      </Link>
    );
  }
  return <div className="admin-stat">{inner}</div>;
}
