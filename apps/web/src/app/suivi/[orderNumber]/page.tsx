'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { Package, Truck, CheckCircle, Clock, ArrowLeft } from 'lucide-react';
import { API_URL } from '@/lib/api';

const PIPELINE = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] as const;

const STATUS_LABELS: Record<string, { label: string; icon: typeof Package }> = {
  PENDING: { label: 'En attente', icon: Clock },
  CONFIRMED: { label: 'Confirmée', icon: CheckCircle },
  PROCESSING: { label: 'En préparation', icon: Package },
  SHIPPED: { label: 'Expédiée', icon: Truck },
  DELIVERED: { label: 'Livrée', icon: CheckCircle },
};

type TrackOrder = {
  orderNumber: string;
  status: string;
  total: number;
  subtotal?: number;
  createdAt?: string;
  guestEmail?: string;
  payment?: { method?: string; status?: string } | null;
  shipment?: { trackingNumber?: string; status?: string } | null;
  statusHistory?: { status: string; note?: string; createdAt: string }[];
  items?: { name: string; quantity: number; unitPrice?: number; total?: number }[];
  shippingAddress?: {
    firstName?: string;
    lastName?: string;
    addressLine1?: string;
    city?: string;
    phone?: string;
  } | null;
};

function pipelineIndex(status: string) {
  const i = PIPELINE.indexOf(status as (typeof PIPELINE)[number]);
  return i >= 0 ? i : 0;
}

export default function TrackingPage() {
  const params = useParams();
  const orderNumber = params.orderNumber as string;
  const [order, setOrder] = useState<TrackOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        let res = await fetch(`${API_URL}/orders/${encodeURIComponent(orderNumber)}`);
        if (!res.ok) {
          res = await fetch(`${API_URL}/shipping/track/${encodeURIComponent(orderNumber)}`);
        }
        if (!res.ok) throw new Error('not found');
        const data = await res.json();
        if (!cancelled) {
          setOrder(data);
          setError('');
        }
      } catch {
        if (!cancelled) {
          setOrder(null);
          setError('Commande introuvable');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [orderNumber]);

  const activeStep = useMemo(() => pipelineIndex(order?.status ?? 'PENDING'), [order?.status]);

  if (loading) {
    return (
      <div className="min-h-[40vh] bg-[#FBF8F4] flex items-center justify-center text-[#6B625A] font-sans text-sm">
        Chargement…
      </div>
    );
  }

  if (!order || error) {
    return (
      <div className="min-h-[40vh] bg-[#FBF8F4] flex flex-col items-center justify-center px-4 text-center">
        <p className="text-[#6B625A] font-sans mb-6">{error || 'Commande introuvable'}</p>
        <Link
          href="/compte/commandes"
          className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-[#A96868] px-8 text-[10px] uppercase tracking-[0.16em] font-semibold text-[#FFF9F5]"
        >
          Mes commandes
        </Link>
      </div>
    );
  }

  const statusInfo = STATUS_LABELS[order.status];
  const history = [...(order.statusHistory ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const addr = order.shippingAddress;
  const items = order.items ?? [];

  return (
    <div className="bg-[#FBF8F4] pb-10 sm:pb-14">
      <section className="border-b border-[#E8D4D5]/80 bg-[#FFF9F5]">
        <div className="w-full px-4 sm:px-8 lg:px-10 xl:px-14 py-5 sm:py-6">
          <nav className="text-[11px] text-[#6B625A] mb-2 font-sans">
            <Link href="/compte/commandes" className="hover:text-[#A96868] transition-colors">
              Mes commandes
            </Link>
            <span className="mx-2 text-[#E8D4D5]">/</span>
            <span className="text-[#1C1714]">Suivi</span>
          </nav>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl sm:text-[1.75rem] text-[#1C1714] tracking-tight">
                Suivi de commande
              </h1>
              <p className="mt-1 text-sm text-[#6B625A] font-sans">
                N° <span className="text-[#1C1714] font-medium">{order.orderNumber}</span>
                {order.createdAt && (
                  <span className="text-[#A89888]">
                    {' '}
                    · {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                )}
              </p>
            </div>
            <span className="rounded-full bg-[#F8F2ED] px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-[#A96868] font-sans font-semibold">
              {statusInfo?.label ?? order.status}
            </span>
          </div>
        </div>
      </section>

      <div className="w-full px-4 sm:px-8 lg:px-10 xl:px-14 pt-6 sm:pt-8">
        {/* Progress — horizontal, compact */}
        <div className="mb-6 rounded-[18px] border border-[#E8D4D5]/90 bg-[#FFF9F5] px-4 py-4 sm:px-6 sm:py-5 shadow-[0_6px_24px_rgba(169,104,104,0.05)]">
          <ol className="flex items-center gap-1 sm:gap-2">
            {PIPELINE.map((key, i) => {
              const done = i <= activeStep;
              const Icon = STATUS_LABELS[key].icon;
              return (
                <li key={key} className="flex flex-1 items-center gap-1 sm:gap-2 min-w-0">
                  <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                    <span
                      className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border transition-colors ${
                        done
                          ? 'border-[#A96868] bg-[#A96868] text-[#FFF9F5]'
                          : 'border-[#E8D4D5] bg-white text-[#A89888]'
                      }`}
                    >
                      <Icon size={14} strokeWidth={1.6} />
                    </span>
                    <span
                      className={`hidden sm:block text-[9px] sm:text-[10px] uppercase tracking-[0.1em] font-sans text-center leading-tight ${
                        done ? 'text-[#1C1714]' : 'text-[#A89888]'
                      }`}
                    >
                      {STATUS_LABELS[key].label}
                    </span>
                  </div>
                  {i < PIPELINE.length - 1 && (
                    <span
                      className={`mb-4 sm:mb-5 h-px flex-1 min-w-[6px] ${
                        i < activeStep ? 'bg-[#A96868]' : 'bg-[#E8D4D5]'
                      }`}
                      aria-hidden
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        {/* Dense 2-col grid */}
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-6">
          {/* Left: articles + total */}
          <div className="rounded-[18px] border border-[#E8D4D5]/90 bg-[#FFF9F5] p-4 sm:p-5 shadow-[0_6px_24px_rgba(169,104,104,0.05)]">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="font-display text-lg text-[#1C1714]">Articles</h2>
              <p className="font-display text-xl text-[#A96868] tabular-nums">
                {formatPrice(order.total)}
              </p>
            </div>

            {items.length > 0 ? (
              <ul className="divide-y divide-[#E8D4D5]/70">
                {items.map((item, idx) => (
                  <li key={`${item.name}-${idx}`} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="font-sans text-sm text-[#1C1714] truncate">{item.name}</p>
                      <p className="text-[11px] text-[#A89888] font-sans">Qté {item.quantity}</p>
                    </div>
                    <p className="shrink-0 font-sans text-sm text-[#1C1714] tabular-nums">
                      {formatPrice(item.total ?? (item.unitPrice ?? 0) * item.quantity)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[#6B625A] font-sans">Détail articles indisponible.</p>
            )}

            {order.shipment?.trackingNumber && (
              <p className="mt-4 pt-3 border-t border-[#E8D4D5]/70 text-[12px] text-[#6B625A] font-sans">
                Suivi Amana :{' '}
                <span className="font-mono text-[#1C1714]">{order.shipment.trackingNumber}</span>
              </p>
            )}
          </div>

          {/* Right: delivery + history compact */}
          <div className="space-y-5">
            {(addr || order.payment) && (
              <div className="rounded-[18px] border border-[#E8D4D5]/90 bg-[#FFF9F5] p-4 sm:p-5 shadow-[0_6px_24px_rgba(169,104,104,0.05)]">
                <h2 className="font-display text-lg text-[#1C1714] mb-3">Livraison</h2>
                {addr && (
                  <p className="text-sm text-[#6B625A] font-sans leading-relaxed">
                    {[addr.firstName, addr.lastName].filter(Boolean).join(' ')}
                    {addr.addressLine1 ? <br /> : null}
                    {addr.addressLine1}
                    {addr.city ? (
                      <>
                        <br />
                        {addr.city}
                      </>
                    ) : null}
                    {addr.phone ? (
                      <>
                        <br />
                        {addr.phone}
                      </>
                    ) : null}
                  </p>
                )}
                {order.payment?.method && (
                  <p className="mt-3 pt-3 border-t border-[#E8D4D5]/70 text-[11px] uppercase tracking-[0.12em] text-[#A89888] font-sans">
                    Paiement · {order.payment.method === 'COD' ? 'À la livraison' : order.payment.method}
                  </p>
                )}
              </div>
            )}

            <div className="rounded-[18px] border border-[#E8D4D5]/90 bg-[#FFF9F5] p-4 sm:p-5 shadow-[0_6px_24px_rgba(169,104,104,0.05)]">
              <h2 className="font-display text-lg text-[#1C1714] mb-3">Historique</h2>
              {history.length === 0 ? (
                <p className="text-sm text-[#6B625A] font-sans">Commande enregistrée.</p>
              ) : (
                <ul className="space-y-3">
                  {history.slice(0, 5).map((h, i) => {
                    const info = STATUS_LABELS[h.status];
                    return (
                      <li key={`${h.status}-${i}`} className="flex gap-3 items-start">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#A96868]" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                            <p className="font-sans text-sm font-medium text-[#1C1714]">
                              {info?.label ?? h.status}
                            </p>
                            <p className="text-[11px] text-[#A89888] font-sans tabular-nums">
                              {new Date(h.createdAt).toLocaleString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                          {h.note && (
                            <p className="text-[12px] text-[#6B625A] font-sans">{h.note}</p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2.5">
          <Link
            href="/compte/commandes"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-[#A96868] px-6 text-[10px] uppercase tracking-[0.14em] font-semibold text-[#FFF9F5] font-sans hover:bg-[#9B6264] transition-colors"
          >
            <ArrowLeft size={14} strokeWidth={1.75} />
            Mes commandes
          </Link>
          <Link
            href="/products"
            className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[#E8D4D5] bg-white px-6 text-[10px] uppercase tracking-[0.14em] font-semibold text-[#1C1714] font-sans hover:border-[#C48782] transition-colors"
          >
            Continuer mes achats
          </Link>
        </div>
      </div>
    </div>
  );
}
