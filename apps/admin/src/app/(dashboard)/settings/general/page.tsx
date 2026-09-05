'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { adminApi } from '@/lib/api';
import type { Settings } from '@/components/settings/types';

export default function SettingsGeneralPage() {
  const [form, setForm] = useState<Settings['general'] | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi<Settings>('/admin/settings')
      .then((s) =>
        setForm(
          s.general ?? {
            siteName: 'mDISCOVER',
            contactEmail: '',
            phone: '',
            whatsapp: '',
            address: '',
            city: '',
            country: '',
            instagram: '',
            facebook: '',
            youtube: '',
            tiktok: '',
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
        body: JSON.stringify({ general: form }),
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

  if (!form) {
    return <p className="text-sm text-red-600 py-10">{error}</p>;
  }

  return (
    <form onSubmit={save} className="w-full space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Link href="/settings" className="admin-btn-ghost mt-0.5">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold">Général</h1>
            <p className="text-sm text-[var(--admin-muted)]">Contact et présence en ligne</p>
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
        <section className="admin-card space-y-3">
          <h2 className="text-sm font-semibold">Boutique</h2>
          <div>
            <label className="admin-label">Nom du site</label>
            <input
              className="admin-input"
              value={form.siteName}
              onChange={(e) => setForm({ ...form, siteName: e.target.value })}
            />
          </div>
          <div>
            <label className="admin-label">Email de contact</label>
            <input
              type="email"
              className="admin-input"
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
            />
          </div>
          <div>
            <label className="admin-label">Téléphone</label>
            <input
              className="admin-input"
              placeholder="+212 661-528608"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="admin-label">WhatsApp</label>
            <input
              className="admin-input"
              placeholder="+212661528608"
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            />
          </div>
        </section>

        <section className="admin-card space-y-3">
          <h2 className="text-sm font-semibold">Adresse</h2>
          <div>
            <label className="admin-label">Adresse</label>
            <input
              className="admin-input"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="admin-label">Ville</label>
              <input
                className="admin-input"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <div>
              <label className="admin-label">Pays</label>
              <input
                className="admin-input"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
              />
            </div>
          </div>
        </section>

        <section className="admin-card space-y-3 xl:col-span-2">
          <h2 className="text-sm font-semibold">Réseaux sociaux</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(
              [
                ['instagram', 'Instagram'],
                ['facebook', 'Facebook'],
                ['youtube', 'YouTube'],
                ['tiktok', 'TikTok'],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="admin-label">{label}</label>
                <input
                  className="admin-input"
                  placeholder="https://…"
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </form>
  );
}
