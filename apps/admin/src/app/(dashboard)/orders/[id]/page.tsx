'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  FileText,
  Package,
  RefreshCw,
  Truck,
} from 'lucide-react';
import { adminApi, getAdminToken, type AdminOrder } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import {
  ORDER_STATUS_LABELS,
  ORDER_TRANSITIONS,
  orderStatusBadgeClass,
  paymentStatusLabel,
} from '@/lib/orders';

type Address = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  address2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
};

function asAddress(value: unknown): Address | null {
  if (!value || typeof value !== 'object') return null;
  return value as Address;
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nextStatus, setNextStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    if (!params.id) return;
    setLoading(true);
    setError('');
    try {
      const data = await adminApi<AdminOrder>(`/admin/orders/${params.id}`);
      setOrder(data);
      setNotes(data.notes ?? '');
      setNextStatus('');
      setStatusNote('');
    } catch {
      setError('Commande introuvable');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function openInvoice() {
    if (!order) return;
    const token = getAdminToken();
    const apiUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL ?? 'http://localhost:4000/api/v1';
    const res = await fetch(`${apiUrl}/admin/orders/${order.id}/invoice`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      setMsg('Impossible de générer la facture');
      return;
    }
    const html = await res.text();
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  }

  async function updateStatus() {
    if (!order || !nextStatus) return;
    setSaving(true);
    setMsg('');
    try {
      const updated = await adminApi<AdminOrder>(`/admin/orders/${order.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus, note: statusNote || undefined }),
      });
      setOrder(updated);
      setNotes(updated.notes ?? '');
      setNextStatus('');
      setStatusNote('');
      setMsg('Statut mis à jour');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Erreur statut');
    } finally {
      setSaving(false);
    }
  }

  async function saveNotes() {
    if (!order) return;
    setSavingNotes(true);
    setMsg('');
    try {
      const updated = await adminApi<AdminOrder>(`/admin/orders/${order.id}/notes`, {
        method: 'PUT',
        body: JSON.stringify({ notes }),
      });
      setOrder(updated);
      setMsg('Notes enregistrées');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Erreur notes');
    } finally {
      setSavingNotes(false);
    }
  }

  async function createAmana() {
    if (!order) return;
    setMsg('');
    try {
      await adminApi(`/admin/shipments/${order.id}/create`, { method: 'POST' });
      setMsg('Colis Amana créé');
      void load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Création Amana échouée');
    }
  }

  async function syncTracking() {
    const tn = order?.shipment?.trackingNumber;
    if (!tn) return;
    setMsg('');
    try {
      await adminApi(`/admin/shipments/sync/${encodeURIComponent(tn)}`, { method: 'POST' });
      setMsg('Suivi synchronisé');
      void load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Sync échouée');
    }
  }

  if (loading) {
    return <p className="text-sm text-[var(--admin-muted)] py-10">Chargement de la commande…</p>;
  }

  if (error || !order) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600">{error || 'Erreur'}</p>
        <Link href="/orders" className="admin-btn-outline">
          Retour aux commandes
        </Link>
      </div>
    );
  }

  const addr = asAddress(order.shippingAddress);
  const allowed = ORDER_TRANSITIONS[order.status] ?? [];
  const customerName = order.user
    ? [order.user.firstName, order.user.lastName].filter(Boolean).join(' ') || order.user.email
    : addr
      ? [addr.firstName, addr.lastName].filter(Boolean).join(' ') || 'Invité'
      : order.guestEmail ?? 'Invité';

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Link href="/orders" className="admin-btn-ghost mt-0.5">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold">{order.orderNumber}</h1>
              <span className={orderStatusBadgeClass(order.status)}>
                {ORDER_STATUS_LABELS[order.status] ?? order.status}
              </span>
            </div>
            <p className="text-sm text-[var(--admin-muted)] mt-0.5">
              {new Date(order.createdAt).toLocaleString('fr-FR')}
              {order.updatedAt ? ` · maj ${new Date(order.updatedAt).toLocaleString('fr-FR')}` : ''}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void openInvoice()} className="admin-btn-outline">
            <FileText size={15} /> Facture
          </button>
          <button type="button" onClick={() => void load()} className="admin-btn-ghost">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {msg && (
        <p className="text-sm bg-[var(--admin-rose-soft)] text-[var(--admin-rose)] border border-[var(--admin-line)] rounded-md px-3 py-2">
          {msg}
        </p>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-5">
        <div className="space-y-5">
          {/* Items */}
          <section className="admin-card space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Package size={15} /> Articles
            </h2>
            <div className="divide-y divide-[var(--admin-line)]">
              {order.items.map((item, i) => (
                <div key={item.id ?? i} className="py-3 flex justify-between gap-4 text-sm">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-[11px] text-[var(--admin-muted)]">
                      {item.sku ? `SKU ${item.sku} · ` : ''}
                      {item.quantity} × {formatPrice(item.unitPrice)}
                    </p>
                  </div>
                  <p className="tabular-nums font-medium shrink-0">
                    {formatPrice(item.total ?? item.unitPrice * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
            <div className="border-t border-[var(--admin-line)] pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-[var(--admin-muted)]">
                <span>Sous-total</span>
                <span className="tabular-nums">{formatPrice(order.subtotal ?? 0)}</span>
              </div>
              <div className="flex justify-between text-[var(--admin-muted)]">
                <span>Livraison</span>
                <span className="tabular-nums">{formatPrice(order.shippingCost ?? 0)}</span>
              </div>
              {(order.discount ?? 0) > 0 && (
                <div className="flex justify-between text-[var(--admin-muted)]">
                  <span>Remise{order.coupon?.code ? ` (${order.coupon.code})` : ''}</span>
                  <span className="tabular-nums">−{formatPrice(order.discount ?? 0)}</span>
                </div>
              )}
              {(order.tax ?? 0) > 0 && (
                <div className="flex justify-between text-[var(--admin-muted)]">
                  <span>Taxe</span>
                  <span className="tabular-nums">{formatPrice(order.tax ?? 0)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-base pt-1">
                <span>Total</span>
                <span className="tabular-nums">{formatPrice(order.total)}</span>
              </div>
            </div>
          </section>

          {/* Timeline */}
          <section className="admin-card space-y-3">
            <h2 className="text-sm font-semibold">Historique</h2>
            {(order.statusHistory?.length ?? 0) === 0 ? (
              <p className="text-sm text-[var(--admin-muted)]">Aucun événement</p>
            ) : (
              <ul className="space-y-3">
                {order.statusHistory!.map((h) => (
                  <li key={h.id} className="flex gap-3 text-sm">
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-[var(--admin-rose)] shrink-0" />
                    <div>
                      <p className="font-medium">{ORDER_STATUS_LABELS[h.status] ?? h.status}</p>
                      {h.note && <p className="text-[var(--admin-muted)]">{h.note}</p>}
                      <p className="text-[11px] text-[var(--admin-muted)]">
                        {new Date(h.createdAt).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-5">
          {/* Status */}
          <section className="admin-card space-y-3">
            <h2 className="text-sm font-semibold">Statut</h2>
            <p className="text-sm">
              Actuel :{' '}
              <span className={orderStatusBadgeClass(order.status)}>
                {ORDER_STATUS_LABELS[order.status] ?? order.status}
              </span>
            </p>
            {allowed.length > 0 ? (
              <>
                <div>
                  <label className="admin-label">Nouveau statut</label>
                  <select
                    className="admin-input"
                    value={nextStatus}
                    onChange={(e) => setNextStatus(e.target.value)}
                  >
                    <option value="">Choisir…</option>
                    {allowed.map((s) => (
                      <option key={s} value={s}>
                        {ORDER_STATUS_LABELS[s] ?? s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="admin-label">Note (optionnel)</label>
                  <input
                    className="admin-input"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="Ex. colis remis au transporteur"
                  />
                </div>
                <button
                  type="button"
                  disabled={!nextStatus || saving}
                  onClick={() => void updateStatus()}
                  className="admin-btn w-full"
                >
                  {saving ? 'Mise à jour…' : 'Mettre à jour le statut'}
                </button>
              </>
            ) : (
              <p className="text-xs text-[var(--admin-muted)]">Aucune transition disponible</p>
            )}
          </section>

          {/* Customer */}
          <section className="admin-card space-y-2 text-sm">
            <h2 className="text-sm font-semibold">Client</h2>
            <p className="font-medium">{customerName}</p>
            <p className="text-[var(--admin-muted)]">
              {order.user?.email ?? order.guestEmail ?? '—'}
            </p>
            {(order.user?.phone || addr?.phone) && (
              <p className="text-[var(--admin-muted)]">{order.user?.phone ?? addr?.phone}</p>
            )}
            {order.user?.id && (
              <Link
                href={`/customers/${order.user.id}`}
                className="text-xs text-[var(--admin-rose)] hover:underline inline-block mt-1"
              >
                Voir le client →
              </Link>
            )}
          </section>

          {/* Address */}
          <section className="admin-card space-y-2 text-sm">
            <h2 className="text-sm font-semibold">Livraison</h2>
            {addr ? (
              <div className="text-[var(--admin-muted)] leading-relaxed">
                <p>
                  {[addr.firstName, addr.lastName].filter(Boolean).join(' ')}
                </p>
                {addr.address && <p>{addr.address}</p>}
                {addr.address2 && <p>{addr.address2}</p>}
                <p>
                  {[addr.postalCode, addr.city].filter(Boolean).join(' ')}
                  {addr.region ? `, ${addr.region}` : ''}
                </p>
                {addr.country && <p>{addr.country}</p>}
                {addr.phone && <p className="mt-1">{addr.phone}</p>}
              </div>
            ) : (
              <p className="text-[var(--admin-muted)]">Adresse non renseignée</p>
            )}
          </section>

          {/* Payment */}
          <section className="admin-card space-y-2 text-sm">
            <h2 className="text-sm font-semibold">Paiement</h2>
            <div className="flex justify-between">
              <span className="text-[var(--admin-muted)]">Méthode</span>
              <span>{order.payment?.method === 'COD' ? 'À la livraison' : order.payment?.method ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--admin-muted)]">Statut</span>
              <span>{paymentStatusLabel(order.payment?.status)}</span>
            </div>
            {order.payment?.amount != null && (
              <div className="flex justify-between">
                <span className="text-[var(--admin-muted)]">Montant</span>
                <span className="tabular-nums">{formatPrice(order.payment.amount)}</span>
              </div>
            )}
          </section>

          {/* Shipping */}
          <section className="admin-card space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Truck size={15} /> Expédition
            </h2>
            {order.shipment ? (
              <div className="text-sm space-y-1.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[var(--admin-muted)]">Statut</span>
                  <span>{order.shipment.status}</span>
                </div>
                {order.shipment.trackingNumber && (
                  <div className="flex justify-between gap-2">
                    <span className="text-[var(--admin-muted)]">Suivi</span>
                    <span className="font-mono text-xs">{order.shipment.trackingNumber}</span>
                  </div>
                )}
                {order.shipment.shippingZone && (
                  <div className="flex justify-between gap-2">
                    <span className="text-[var(--admin-muted)]">Zone</span>
                    <span>{order.shipment.shippingZone}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-[var(--admin-muted)]">Pas encore de colis</p>
            )}

            {!order.shipment?.trackingNumber &&
              ['CONFIRMED', 'PROCESSING', 'PENDING'].includes(order.status) && (
                <button type="button" onClick={() => void createAmana()} className="admin-btn-black w-full">
                  Créer colis Amana
                </button>
              )}
            {order.shipment?.trackingNumber && (
              <button type="button" onClick={() => void syncTracking()} className="admin-btn-outline w-full">
                Sync suivi Amana
              </button>
            )}
            {order.shipment?.labelUrl && (
              <a
                href={order.shipment.labelUrl}
                target="_blank"
                rel="noreferrer"
                className="admin-btn-outline w-full"
              >
                Étiquette
              </a>
            )}
          </section>

          {/* Internal notes */}
          <section className="admin-card space-y-3">
            <h2 className="text-sm font-semibold">Notes internes</h2>
            <textarea
              className="admin-input min-h-[100px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes visibles uniquement en admin…"
            />
            <button
              type="button"
              disabled={savingNotes}
              onClick={() => void saveNotes()}
              className="admin-btn-outline w-full"
            >
              {savingNotes ? 'Enregistrement…' : 'Enregistrer les notes'}
            </button>
          </section>
        </div>
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={() => router.push('/orders')} className="admin-btn-outline">
          Retour à la liste
        </button>
      </div>
    </div>
  );
}
