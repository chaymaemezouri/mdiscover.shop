'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Heart,
  MapPin,
  Package,
  RefreshCw,
  ShieldBan,
  ShieldCheck,
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { adminConfirm } from '@/lib/admin-dialog';
import { formatPrice } from '@/lib/utils';
import { ORDER_STATUS_LABELS, orderStatusBadgeClass } from '@/lib/orders';

type Address = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  region?: string | null;
  postalCode?: string | null;
  country: string;
  isDefault: boolean;
};

type CustomerOrder = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  payment?: { method: string; status: string } | null;
  _count?: { items: number };
  items?: { name: string; quantity: number }[];
};

type WishlistItem = {
  id: string;
  product?: {
    id: string;
    slug: string;
    nameFr: string;
    nameEn?: string | null;
    basePrice: number;
    status: string;
    images?: { url: string }[];
  } | null;
};

type CustomerDetail = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  status: string;
  locale?: string;
  emailVerified?: boolean;
  createdAt: string;
  updatedAt?: string;
  orderCount: number;
  addressCount: number;
  wishlistCount: number;
  reviewCount: number;
  totalSpent: number;
  completedOrders: number;
  lastOrderAt?: string | null;
  lastOrderNumber?: string | null;
  addresses: Address[];
  orders: CustomerOrder[];
  wishlist: WishlistItem[];
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Actif',
  BLOCKED: 'Bloqué',
  DELETED: 'Supprimé',
};

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    if (!params.id) return;
    setLoading(true);
    setError('');
    try {
      const data = await adminApi<CustomerDetail>(`/admin/customers/${params.id}`);
      setCustomer(data);
    } catch {
      setError('Client introuvable');
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleBlock() {
    if (!customer) return;
    const blocked = customer.status === 'BLOCKED';
    if (
      !(await adminConfirm({
        title: blocked ? 'Débloquer le client' : 'Bloquer le client',
        message: blocked
          ? `Débloquer ${customer.email} ?`
          : `Bloquer ${customer.email} ? Il ne pourra plus se connecter.`,
        confirmLabel: blocked ? 'Débloquer' : 'Bloquer',
        danger: !blocked,
      }))
    ) {
      return;
    }
    setBusy(true);
    setMsg('');
    try {
      await adminApi(`/admin/customers/${customer.id}/${blocked ? 'unblock' : 'block'}`, {
        method: 'PUT',
      });
      setMsg(blocked ? 'Client débloqué' : 'Client bloqué');
      void load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-[var(--admin-muted)] py-10">Chargement du client…</p>;
  }

  if (error || !customer) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600">{error || 'Erreur'}</p>
        <Link href="/customers" className="admin-btn-outline">
          Retour aux clients
        </Link>
      </div>
    );
  }

  const name =
    [customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.email;

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Link href="/customers" className="admin-btn-ghost mt-0.5">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold">{name}</h1>
              <span
                className={`admin-badge ${
                  customer.status === 'BLOCKED'
                    ? 'bg-red-50 text-red-700'
                    : 'admin-badge-ok'
                }`}
              >
                {STATUS_LABELS[customer.status] ?? customer.status}
              </span>
            </div>
            <p className="text-sm text-[var(--admin-muted)] mt-0.5">
              {customer.email}
              {customer.phone ? ` · ${customer.phone}` : ''}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void load()} className="admin-btn-ghost">
            <RefreshCw size={15} />
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void toggleBlock()}
            className={customer.status === 'BLOCKED' ? 'admin-btn' : 'admin-btn-outline'}
          >
            {customer.status === 'BLOCKED' ? (
              <>
                <ShieldCheck size={15} /> Débloquer
              </>
            ) : (
              <>
                <ShieldBan size={15} /> Bloquer
              </>
            )}
          </button>
        </div>
      </div>

      {msg && (
        <p className="text-sm bg-[var(--admin-rose-soft)] text-[var(--admin-rose)] border border-[var(--admin-line)] rounded-md px-3 py-2">
          {msg}
        </p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Commandes', value: String(customer.orderCount) },
          { label: 'Total dépensé', value: formatPrice(customer.totalSpent) },
          { label: 'Wishlist', value: String(customer.wishlistCount) },
          { label: 'Avis', value: String(customer.reviewCount) },
        ].map((s) => (
          <div key={s.label} className="admin-stat">
            <p className="text-xs text-[var(--admin-muted)]">{s.label}</p>
            <p className="text-lg font-semibold tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_1fr] gap-5">
        <div className="space-y-5">
          {/* Orders */}
          <section className="admin-card space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Package size={15} /> Commandes
              </h2>
              {customer.orderCount > 0 && (
                <Link
                  href={`/orders?search=${encodeURIComponent(customer.email)}`}
                  className="text-xs text-[var(--admin-rose)] hover:underline"
                >
                  Voir dans commandes →
                </Link>
              )}
            </div>
            {customer.orders.length === 0 ? (
              <p className="text-sm text-[var(--admin-muted)]">Aucune commande</p>
            ) : (
              <div className="divide-y divide-[var(--admin-line)]">
                {customer.orders.map((o) => (
                  <Link
                    key={o.id}
                    href={`/orders/${o.id}`}
                    className="py-3 flex flex-wrap items-center justify-between gap-2 hover:bg-black/[0.02] -mx-2 px-2 rounded-md"
                  >
                    <div>
                      <p className="font-medium text-sm">{o.orderNumber}</p>
                      <p className="text-[11px] text-[var(--admin-muted)]">
                        {new Date(o.createdAt).toLocaleString('fr-FR')}
                        {o._count?.items != null ? ` · ${o._count.items} art.` : ''}
                        {o.payment?.method ? ` · ${o.payment.method}` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="tabular-nums font-medium text-sm">{formatPrice(o.total)}</p>
                      <span className={`mt-1 inline-flex ${orderStatusBadgeClass(o.status)}`}>
                        {ORDER_STATUS_LABELS[o.status] ?? o.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Wishlist */}
          <section className="admin-card space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Heart size={15} /> Wishlist
            </h2>
            {customer.wishlist.length === 0 ? (
              <p className="text-sm text-[var(--admin-muted)]">Liste vide</p>
            ) : (
              <ul className="space-y-2">
                {customer.wishlist.map((w) => {
                  const p = w.product;
                  if (!p) return null;
                  return (
                    <li key={w.id} className="flex items-center gap-3 text-sm">
                      <div className="w-10 h-10 rounded border border-[var(--admin-line)] overflow-hidden bg-black/[0.03] shrink-0">
                        {p.images?.[0]?.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{p.nameFr}</p>
                        <p className="text-[11px] text-[var(--admin-muted)]">
                          {formatPrice(p.basePrice)} · {p.status}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-5">
          {/* Profile */}
          <section className="admin-card space-y-2 text-sm">
            <h2 className="text-sm font-semibold">Profil</h2>
            <div className="flex justify-between gap-2">
              <span className="text-[var(--admin-muted)]">Email</span>
              <span className="text-right break-all">{customer.email}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-[var(--admin-muted)]">Téléphone</span>
              <span>{customer.phone || '—'}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-[var(--admin-muted)]">Langue</span>
              <span>{customer.locale ?? '—'}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-[var(--admin-muted)]">Email vérifié</span>
              <span>{customer.emailVerified ? 'Oui' : 'Non'}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-[var(--admin-muted)]">Inscrit le</span>
              <span>{new Date(customer.createdAt).toLocaleString('fr-FR')}</span>
            </div>
            {customer.lastOrderAt && (
              <div className="flex justify-between gap-2">
                <span className="text-[var(--admin-muted)]">Dernière commande</span>
                <span className="text-right">
                  {customer.lastOrderNumber}
                  <br />
                  <span className="text-[11px]">
                    {new Date(customer.lastOrderAt).toLocaleDateString('fr-FR')}
                  </span>
                </span>
              </div>
            )}
          </section>

          {/* Addresses */}
          <section className="admin-card space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <MapPin size={15} /> Adresses
            </h2>
            {customer.addresses.length === 0 ? (
              <p className="text-sm text-[var(--admin-muted)]">Aucune adresse</p>
            ) : (
              <ul className="space-y-3">
                {customer.addresses.map((a) => (
                  <li
                    key={a.id}
                    className="text-sm rounded-md border border-[var(--admin-line)] p-3"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="font-medium">
                        {a.firstName} {a.lastName}
                      </p>
                      {a.isDefault && <span className="admin-badge-rose">Défaut</span>}
                    </div>
                    <p className="text-[var(--admin-muted)] leading-relaxed">
                      {a.addressLine1}
                      {a.addressLine2 ? <>, {a.addressLine2}</> : null}
                      <br />
                      {[a.postalCode, a.city].filter(Boolean).join(' ')}
                      {a.region ? `, ${a.region}` : ''}
                      <br />
                      {a.country} · {a.phone}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
