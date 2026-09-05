'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin, Package, Plus } from 'lucide-react';
import { adminApi } from '@/lib/api';

export default function ShippingHubPage() {
  const [counts, setCounts] = useState({ zones: 0, products: 0 });

  useEffect(() => {
    Promise.all([
      adminApi<unknown[]>('/admin/shipping/zones').catch(() => []),
      adminApi<{ meta?: { total?: number }; data?: unknown[] }>('/admin/products?page=1&limit=1').catch(
        () => ({ meta: { total: 0 }, data: [] as unknown[] }),
      ),
    ]).then(([zones, products]) => {
      setCounts({
        zones: Array.isArray(zones) ? zones.length : 0,
        products: products?.meta?.total ?? products?.data?.length ?? 0,
      });
    });
  }, []);

  const cards = [
    {
      href: '/shipping/zones',
      icon: MapPin,
      title: 'Zones & tarifs',
      desc: 'Villes, prix et seuil de gratuité',
      count: counts.zones,
      action: '/shipping/zones/new',
    },
    {
      href: '/shipping/products',
      icon: Package,
      title: 'Frais par produit',
      desc: 'Activer / désactiver les frais produit',
      count: counts.products,
      action: null as string | null,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Livraison</h1>
        <p className="text-sm text-[var(--admin-muted)] mt-0.5">
          Zones géographiques et frais par produit
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((c) => (
          <div key={c.href} className="admin-card flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--admin-rose-soft)] text-[var(--admin-rose)]">
                  <c.icon size={18} />
                </span>
                <div>
                  <h2 className="font-semibold">{c.title}</h2>
                  <p className="text-xs text-[var(--admin-muted)]">{c.desc}</p>
                </div>
              </div>
              <span className="text-lg font-semibold tabular-nums">{c.count}</span>
            </div>
            <div className="flex gap-2 mt-auto">
              <Link href={c.href} className="admin-btn-outline flex-1 text-center text-xs">
                Ouvrir
              </Link>
              {c.action && (
                <Link href={c.action} className="admin-btn text-xs">
                  <Plus size={14} /> Nouveau
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
