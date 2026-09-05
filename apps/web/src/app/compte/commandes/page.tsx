'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AccountShell } from '@/components/account/AccountShell';
import { formatPrice } from '@/lib/utils';
import { API_URL } from '@/lib/api';
import { clearAuthTokens, getAccessToken } from '@/lib/auth-client';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  items: { name: string; quantity: number }[];
  shipment?: { trackingNumber?: string; status: string };
}

const STATUS_FR: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  PROCESSING: 'En préparation',
  SHIPPED: 'Expédiée',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
};

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const token = getAccessToken();

    if (!token) {
      clearAuthTokens();
      window.location.replace('/compte');
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);

    async function loadOrders() {
      try {
        const res = await fetch(`${API_URL}/orders/my`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        const data = await res.json().catch(() => null);

        if (cancelled) return;

        if (res.status === 401) {
          clearAuthTokens();
          window.location.replace('/compte');
          return;
        }

        if (!res.ok) {
          setOrders([]);
          setError(
            typeof data?.message === 'string'
              ? data.message
              : 'Impossible de charger les commandes.',
          );
          return;
        }

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : [];
        setOrders(list);
        setError('');
      } catch {
        if (cancelled) return;
        setOrders([]);
        setError('Erreur réseau. Vérifiez que l’API est démarrée.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadOrders();

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  if (loading) {
    return (
      <AccountShell title="Mes commandes">
        <p className="text-center text-charcoal-500 font-sans py-10">Chargement…</p>
      </AccountShell>
    );
  }

  return (
    <AccountShell title="Mes commandes">
      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-sans">
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="rounded-[18px] border border-[#E8D4D5] bg-[#FFF9F5] px-6 py-12 text-center shadow-[0_6px_24px_rgba(169,104,104,0.05)]">
          <p className="text-charcoal-500 font-sans mb-4">
            {error ? 'Les commandes n’ont pas pu être chargées.' : 'Aucune commande pour le moment.'}
          </p>
          <Link
            href="/products"
            className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-[#A96868] px-8 text-[10px] uppercase tracking-[0.16em] font-semibold text-[#FFF9F5] font-sans hover:bg-[#9B6264] transition-colors"
          >
            Voir la boutique
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[18px] border border-[#E8D4D5]/90 bg-[#FFF9F5] shadow-[0_6px_24px_rgba(169,104,104,0.05)]">
          <ul className="divide-y divide-[#E8D4D5]/80">
            {orders.map((order) => (
              <li
                key={order.id}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="font-sans text-sm font-semibold text-[#1C1714]">
                      {order.orderNumber}
                    </p>
                    <span className="rounded-full bg-[#F8F2ED] px-2.5 py-0.5 text-[9px] uppercase tracking-[0.12em] text-[#A96868] font-sans font-semibold">
                      {STATUS_FR[order.status] ?? order.status}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#A89888] font-sans mb-1">
                    {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                  <p className="text-sm text-[#6B625A] font-sans line-clamp-1">
                    {(order.items ?? []).map((i) => `${i.name} ×${i.quantity}`).join(' · ') || '—'}
                  </p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                  <span className="font-display text-lg text-[#A96868] tabular-nums">
                    {formatPrice(order.total)}
                  </span>
                  <Link
                    href={`/suivi/${order.orderNumber}`}
                    className="inline-flex min-h-[36px] items-center rounded-full border border-[#E8D4D5] bg-white px-4 text-[10px] uppercase tracking-[0.12em] font-semibold text-[#1C1714] font-sans hover:border-[#A96868] hover:text-[#A96868] transition-colors"
                  >
                    Suivre
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </AccountShell>
  );
}
