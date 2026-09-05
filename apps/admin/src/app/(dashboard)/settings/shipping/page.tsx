'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { adminApi } from '@/lib/api';
import type { Settings } from '@/components/settings/types';

export default function SettingsShippingPage() {
  const [thresholdMad, setThresholdMad] = useState('500');
  const [bannerMessage, setBannerMessage] = useState('');
  const [estimatedDays, setEstimatedDays] = useState('');
  const [codEnabled, setCodEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    adminApi<Settings>('/admin/settings')
      .then((s) => {
        const shipping = s.shipping;
        setThresholdMad(((shipping?.freeShippingThreshold ?? 50000) / 100).toFixed(0));
        setBannerMessage(shipping?.bannerMessage ?? '');
        setEstimatedDays(shipping?.estimatedDays ?? '');
        setCodEnabled(shipping?.codEnabled !== false);
        setLoaded(true);
      })
      .catch(() => setError('Impossible de charger'));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const mad = Number(thresholdMad);
    if (Number.isNaN(mad) || mad < 0) {
      setError('Seuil invalide');
      return;
    }
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await adminApi('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({
          shipping: {
            freeShippingThreshold: Math.round(mad * 100),
            bannerMessage,
            estimatedDays,
            codEnabled,
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

  if (!loaded && !error) {
    return <p className="text-sm text-[var(--admin-muted)] py-10">Chargement…</p>;
  }

  return (
    <form onSubmit={save} className="w-full space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Link href="/settings" className="admin-btn-ghost mt-0.5">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold">Livraison & paiement</h1>
            <p className="text-sm text-[var(--admin-muted)]">Seuils, COD et messages client</p>
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
          <div>
            <label className="admin-label">Livraison gratuite dès (MAD)</label>
            <input
              inputMode="decimal"
              className="admin-input"
              value={thresholdMad}
              onChange={(e) => setThresholdMad(e.target.value)}
            />
            <p className="text-[11px] text-[var(--admin-muted)] mt-1">
              Affiché aux clients comme seuil panier
            </p>
          </div>
          <div>
            <label className="admin-label">Délai estimé</label>
            <input
              className="admin-input"
              placeholder="2-5 jours"
              value={estimatedDays}
              onChange={(e) => setEstimatedDays(e.target.value)}
            />
          </div>
          <div>
            <label className="admin-label">Paiement à la livraison (COD)</label>
            <div className="flex gap-2 pt-1">
              {(
                [
                  [true, 'Activé'],
                  [false, 'Désactivé'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setCodEnabled(value)}
                  className={
                    codEnabled === value
                      ? 'admin-btn text-xs py-1.5 px-3'
                      : 'admin-btn-outline text-xs py-1.5 px-3'
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="admin-card space-y-3">
          <h2 className="text-sm font-semibold">Message bannière</h2>
          <textarea
            className="admin-input min-h-[120px]"
            placeholder="Paiement sécurisé · Livraison Amana…"
            value={bannerMessage}
            onChange={(e) => setBannerMessage(e.target.value)}
          />
          <p className="text-[11px] text-[var(--admin-muted)]">
            Texte affiché en bandeau / checkout
          </p>
        </section>
      </div>
    </form>
  );
}
