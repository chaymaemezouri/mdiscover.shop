'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { adminApi } from '@/lib/api';

export type ZoneFormState = {
  name: string;
  cities: string;
  regions: string;
  priceMad: string;
  freeAboveMad: string;
  isActive: boolean;
};

export const EMPTY_ZONE: ZoneFormState = {
  name: '',
  cities: '',
  regions: '',
  priceMad: '',
  freeAboveMad: '',
  isActive: true,
};

function splitList(value: string) {
  return value
    .split(/[,;\n]/)
    .map((c) => c.trim())
    .filter(Boolean);
}

type Props = {
  mode: 'create' | 'edit';
  zoneId?: string;
  initial?: ZoneFormState;
};

export function ShippingZoneForm({ mode, zoneId, initial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<ZoneFormState>(initial ?? EMPTY_ZONE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initial) setForm(initial);
  }, [initial]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) {
      setError('Nom obligatoire');
      return;
    }
    const priceMad = Number(form.priceMad);
    if (Number.isNaN(priceMad) || priceMad < 0) {
      setError('Prix invalide');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        cities: splitList(form.cities),
        regions: splitList(form.regions),
        price: Math.round(priceMad * 100),
        freeAbove: form.freeAboveMad.trim()
          ? Math.round(Number(form.freeAboveMad) * 100)
          : null,
        isActive: form.isActive,
      };
      if (mode === 'edit' && zoneId) {
        await adminApi(`/admin/shipping/zones/${zoneId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await adminApi('/admin/shipping/zones', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      router.push('/shipping/zones');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="w-full space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Link href="/shipping/zones" className="admin-btn-ghost mt-0.5">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold">
              {mode === 'create' ? 'Nouvelle zone' : 'Modifier la zone'}
            </h1>
            <p className="text-sm text-[var(--admin-muted)]">Tarifs et couverture géographique</p>
          </div>
        </div>
        <button type="submit" disabled={saving} className="admin-btn">
          {saving ? 'Enregistrement…' : mode === 'create' ? 'Créer' : 'Enregistrer'}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_1fr] gap-5">
        <section className="admin-card space-y-4">
          <div>
            <label className="admin-label">Nom *</label>
            <input
              required
              autoFocus
              className="admin-input"
              placeholder="Ex. Casablanca / Rabat"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="admin-label">Villes</label>
            <textarea
              className="admin-input min-h-[100px]"
              placeholder="Casablanca, Rabat, Salé…"
              value={form.cities}
              onChange={(e) => setForm({ ...form, cities: e.target.value })}
            />
            <p className="text-[11px] text-[var(--admin-muted)] mt-1">
              Séparées par virgule. Zone sans villes = fallback national.
            </p>
          </div>
          <div>
            <label className="admin-label">Régions (optionnel)</label>
            <textarea
              className="admin-input min-h-[70px]"
              placeholder="Grand Casablanca…"
              value={form.regions}
              onChange={(e) => setForm({ ...form, regions: e.target.value })}
            />
          </div>
        </section>

        <section className="admin-card space-y-4">
          <h2 className="text-sm font-semibold">Tarification</h2>
          <div>
            <label className="admin-label">Prix livraison (MAD) *</label>
            <input
              required
              inputMode="decimal"
              className="admin-input"
              placeholder="45.00"
              value={form.priceMad}
              onChange={(e) => setForm({ ...form, priceMad: e.target.value })}
            />
          </div>
          <div>
            <label className="admin-label">Gratuit dès (MAD)</label>
            <input
              inputMode="decimal"
              className="admin-input"
              placeholder="Vide = jamais gratuit"
              value={form.freeAboveMad}
              onChange={(e) => setForm({ ...form, freeAboveMad: e.target.value })}
            />
          </div>
          <div>
            <label className="admin-label">Statut</label>
            <div className="flex gap-2 pt-1">
              {(
                [
                  [true, 'Active'],
                  [false, 'Inactive'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setForm({ ...form, isActive: value })}
                  className={
                    form.isActive === value
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
      </div>
    </form>
  );
}
