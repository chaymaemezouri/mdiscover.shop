'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Globe,
  Truck,
  Store,
  Shield,
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import type { Settings } from '@/components/settings/types';

export default function SettingsHubPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [adminEmail, setAdminEmail] = useState('');

  useEffect(() => {
    adminApi<Settings>('/admin/settings').then(setSettings).catch(console.error);
    adminApi<{ email?: string }>('/admin/me')
      .then((p) => setAdminEmail(p.email ?? ''))
      .catch(() => {});
  }, []);

  const cards = [
    {
      href: '/settings/general',
      icon: Globe,
      title: 'Général',
      desc: 'Contact, adresse, réseaux sociaux',
      meta: settings?.general?.siteName || '…',
    },
    {
      href: '/settings/shipping',
      icon: Truck,
      title: 'Livraison & paiement',
      desc: 'Seuil gratuité, COD, messages',
      meta:
        settings?.shipping?.freeShippingThreshold != null
          ? `Gratuit dès ${(settings.shipping.freeShippingThreshold / 100).toFixed(0)} MAD`
          : '…',
    },
    {
      href: '/settings/store',
      icon: Store,
      title: 'Boutique',
      desc: 'Maintenance, checkout, stock',
      meta: settings?.store?.maintenanceMode ? 'Maintenance ON' : settings ? 'En ligne' : '…',
    },
    {
      href: '/settings/security',
      icon: Shield,
      title: 'Sécurité',
      desc: 'Email, nom et mot de passe',
      meta: adminEmail || 'Compte admin',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Réglages</h1>
        <p className="text-sm text-[var(--admin-muted)] mt-0.5">
          Configuration de la boutique et du compte admin
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="admin-card flex flex-col gap-4 hover:border-[var(--admin-rose)] transition-colors"
          >
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
            </div>
            <p className="text-xs text-[var(--admin-muted)] mt-auto">{c.meta}</p>
            <span className="admin-btn-outline text-xs text-center">Ouvrir</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
