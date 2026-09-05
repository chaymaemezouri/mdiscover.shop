'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { adminApi } from '@/lib/api';
import type { Settings } from '@/components/settings/types';

export default function SettingsStorePage() {
  const [form, setForm] = useState<Settings['store'] | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi<Settings>('/admin/settings')
      .then((s) =>
        setForm(
          s.store ?? {
            maintenanceMode: false,
            allowGuestCheckout: true,
            currency: 'MAD',
            lowStockThreshold: 5,
            orderNotifyEmail: '',
            showPricesWithTax: true,
          },
        ),
      )
      .catch(() => setError('Impossible de charger'));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await adminApi('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({
          store: {
            ...form,
            lowStockThreshold: Number(form.lowStockThreshold) || 0,
          },
        }),
      });
      setMessage('Enregistré');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  }

  if (!form && !error) {
    return <p className="text-sm text-[var(--admin-muted)] py-10">Chargement…</p>;
  }
  if (!form) return <p className="text-sm text-red-600 py-10">{error}</p>;

  return (
    <form onSubmit={save} className="w-full space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Link href="/settings" className="admin-btn-ghost mt-0.5">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold">Boutique</h1>
            <p className="text-sm text-[var(--admin-muted)]">Fonctionnement du storefront</p>
          </div>
        </div>
        <button type="submit" disabled={saving} className="admin-btn">
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>

      {(message || error) && (
        <p
          className={`text-sm rounded-md px-3 py-2 border ${
            error
              ? 'text-red-600 bg-red-50 border-red-100'
              : 'text-emerald-700 bg-emerald-50 border-emerald-100'
          }`}
        >
          {error || message}
        </p>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <section className="admin-card space-y-4">
          <h2 className="text-sm font-semibold">Accès</h2>
          {(
            [
              ['maintenanceMode', 'Mode maintenance', 'Site inaccessible aux clients'],
              ['allowGuestCheckout', 'Commande invité', 'Acheter sans créer de compte'],
              ['showPricesWithTax', 'Prix TTC', 'Afficher les prix toutes taxes'],
            ] as const
          ).map(([key, label, hint]) => (
            <div key={key}>
              <label className="admin-label">{label}</label>
              <p className="text-[11px] text-[var(--admin-muted)] mb-1.5">{hint}</p>
              <div className="flex gap-2">
                {(
                  [
                    [true, 'Oui'],
                    [false, 'Non'],
                  ] as const
                ).map(([value, btn]) => (
                  <button
                    key={btn}
                    type="button"
                    onClick={() => setForm({ ...form, [key]: value })}
                    className={
                      form[key] === value
                        ? 'admin-btn text-xs py-1.5 px-3'
                        : 'admin-btn-outline text-xs py-1.5 px-3'
                    }
                  >
                    {btn}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className="admin-card space-y-4">
          <h2 className="text-sm font-semibold">Opérations</h2>
          <div>
            <label className="admin-label">Devise</label>
            <input
              className="admin-input"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
            />
          </div>
          <div>
            <label className="admin-label">Alerte stock faible (unités)</label>
            <input
              type="number"
              min={0}
              className="admin-input"
              value={form.lowStockThreshold}
              onChange={(e) =>
                setForm({ ...form, lowStockThreshold: Number(e.target.value) || 0 })
              }
            />
          </div>
          <div>
            <label className="admin-label">Email notifications commandes</label>
            <input
              type="email"
              className="admin-input"
              placeholder="ops@mdiscover.ma"
              value={form.orderNotifyEmail}
              onChange={(e) => setForm({ ...form, orderNotifyEmail: e.target.value })}
            />
          </div>
        </section>
      </div>
    </form>
  );
}
