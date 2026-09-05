'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { adminApi, type Category } from '@/lib/api';

export type CouponFormState = {
  code: string;
  type: string;
  value: number;
  minOrderAmountMad: string;
  maxUses: string;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
  categoryIds: string[];
};

export const EMPTY_COUPON_FORM: CouponFormState = {
  code: '',
  type: 'PERCENTAGE',
  value: 10,
  minOrderAmountMad: '',
  maxUses: '',
  startsAt: '',
  expiresAt: '',
  isActive: true,
  categoryIds: [],
};

type StepId = 'essentiel' | 'regles' | 'portee';

const STEPS: { id: StepId; label: string; hint: string }[] = [
  { id: 'essentiel', label: '1. Essentiel', hint: 'Code, type, valeur' },
  { id: 'regles', label: '2. Règles', hint: 'Limites & dates' },
  { id: 'portee', label: '3. Portée', hint: 'Catégories (optionnel)' },
];

type Props = {
  mode: 'create' | 'edit';
  couponId?: string;
  initial?: CouponFormState;
};

export function CouponForm({ mode, couponId, initial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<CouponFormState>(initial ?? EMPTY_COUPON_FORM);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<StepId>('essentiel');

  useEffect(() => {
    if (initial) setForm(initial);
  }, [initial]);

  useEffect(() => {
    adminApi<Category[]>('/admin/categories')
      .then((list) => setCategories(Array.isArray(list) ? list : []))
      .catch(console.error);
  }, []);

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  async function handleSave(e?: React.FormEvent) {
    e?.preventDefault();
    setError('');
    if (!form.code.trim()) {
      setError('Code obligatoire');
      setStep('essentiel');
      return;
    }
    setSaving(true);
    try {
      const value =
        form.type === 'PERCENTAGE' || form.type === 'FREE_SHIPPING'
          ? Number(form.value)
          : Math.round(Number(form.value) * 100);

      const payload = {
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: Number.isFinite(value) ? value : 0,
        minOrderAmount: form.minOrderAmountMad
          ? Math.round(Number(form.minOrderAmountMad) * 100)
          : null,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        startsAt: form.startsAt || null,
        expiresAt: form.expiresAt || null,
        isActive: form.isActive,
        categoryIds: form.categoryIds,
      };

      if (mode === 'edit' && couponId) {
        await adminApi(`/admin/coupons/${couponId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        router.push(`/coupons/${couponId}`);
      } else {
        const created = await adminApi<{ id: string }>('/admin/coupons', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        router.push(created?.id ? `/coupons/${created.id}` : '/coupons');
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur enregistrement');
    } finally {
      setSaving(false);
    }
  }

  function goNext() {
    const idx = STEPS.findIndex((s) => s.id === step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].id);
  }

  function goPrev() {
    const idx = STEPS.findIndex((s) => s.id === step);
    if (idx > 0) setStep(STEPS[idx - 1].id);
  }

  function toggleCategory(id: string) {
    setForm((f) => ({
      ...f,
      categoryIds: f.categoryIds.includes(id)
        ? f.categoryIds.filter((x) => x !== id)
        : [...f.categoryIds, id],
    }));
  }

  return (
    <form onSubmit={handleSave} className="w-full space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Link href="/coupons" className="admin-btn-ghost mt-0.5">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold">
              {mode === 'create' ? 'Nouveau coupon' : 'Modifier le coupon'}
            </h1>
            <p className="text-sm text-[var(--admin-muted)]">
              Remises, livraison offerte et codes promo
            </p>
          </div>
        </div>
        <button type="submit" disabled={saving} className="admin-btn shrink-0">
          {saving ? 'Enregistrement…' : mode === 'create' ? 'Créer' : 'Enregistrer'}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <nav className="admin-card !p-2 flex flex-wrap gap-1">
        {STEPS.map((s) => {
          const active = step === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(s.id)}
              className={`flex-1 min-w-[140px] rounded-md px-3 py-2 text-left transition-colors ${
                active
                  ? 'bg-[var(--admin-rose)] text-white'
                  : 'hover:bg-black/[0.04] text-[var(--admin-black)]'
              }`}
            >
              <span className="block text-sm font-medium">{s.label}</span>
              <span
                className={`block text-[11px] mt-0.5 ${active ? 'text-white/80' : 'text-[var(--admin-muted)]'}`}
              >
                {s.hint}
              </span>
            </button>
          );
        })}
      </nav>

      {step === 'essentiel' && (
        <section className="admin-card space-y-4">
          <div>
            <h2 className="text-sm font-semibold">Essentiel</h2>
            <p className="text-xs text-[var(--admin-muted)] mt-0.5">
              Ces champs suffisent pour créer le coupon
            </p>
          </div>

          <div>
            <label className="admin-label">Code *</label>
            <input
              required
              autoFocus
              className="admin-input uppercase font-mono text-base tracking-wide"
              placeholder="Ex. WELCOME10"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            />
          </div>

          <div>
            <label className="admin-label">Type</label>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['PERCENTAGE', 'Pourcentage'],
                  ['FIXED', 'Montant fixe'],
                  ['FREE_SHIPPING', 'Livraison offerte'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      type: value,
                      value: value === 'FREE_SHIPPING' ? 0 : form.value || 10,
                    })
                  }
                  className={
                    form.type === value
                      ? 'admin-btn text-xs py-1.5 px-3'
                      : 'admin-btn-outline text-xs py-1.5 px-3'
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {form.type !== 'FREE_SHIPPING' && (
            <div className="max-w-xs">
              <label className="admin-label">
                {form.type === 'PERCENTAGE' ? 'Remise (%)' : 'Remise (MAD)'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="admin-input"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
              />
            </div>
          )}

          <div>
            <label className="admin-label">Statut</label>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  [true, 'Actif'],
                  [false, 'Inactif'],
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
      )}

      {step === 'regles' && (
        <section className="admin-card space-y-4">
          <div>
            <h2 className="text-sm font-semibold">Règles</h2>
            <p className="text-xs text-[var(--admin-muted)] mt-0.5">Optionnel</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="admin-label">Min. commande (MAD)</label>
              <input
                className="admin-input"
                placeholder="Ex. 300"
                value={form.minOrderAmountMad}
                onChange={(e) => setForm({ ...form, minOrderAmountMad: e.target.value })}
              />
            </div>
            <div>
              <label className="admin-label">Max utilisations</label>
              <input
                type="number"
                className="admin-input"
                placeholder="Illimité si vide"
                value={form.maxUses}
                onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
              />
            </div>
            <div>
              <label className="admin-label">Début</label>
              <input
                type="date"
                className="admin-input"
                value={form.startsAt}
                onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
              />
            </div>
            <div>
              <label className="admin-label">Expiration</label>
              <input
                type="date"
                className="admin-input"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              />
            </div>
          </div>
        </section>
      )}

      {step === 'portee' && (
        <section className="admin-card space-y-4">
          <div>
            <h2 className="text-sm font-semibold">Portée</h2>
            <p className="text-xs text-[var(--admin-muted)] mt-0.5">
              Vide = valide sur tout le catalogue. Sinon limité aux catégories cochées.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const on = form.categoryIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCategory(c.id)}
                  className={
                    on
                      ? 'admin-btn text-xs py-1.5 px-3'
                      : 'admin-btn-outline text-xs py-1.5 px-3'
                  }
                >
                  {c.nameFr}
                </button>
              );
            })}
          </div>
          {form.categoryIds.length > 0 && (
            <button
              type="button"
              className="text-xs text-[var(--admin-muted)] hover:text-[var(--admin-black)]"
              onClick={() => setForm({ ...form, categoryIds: [] })}
            >
              Tout le catalogue
            </button>
          )}
        </section>
      )}

      <div className="sticky bottom-0 z-20 -mx-1 mt-2 rounded-lg border border-[var(--admin-line)] bg-white/95 backdrop-blur-sm px-3 py-3 flex items-center justify-between gap-3 shadow-sm">
        <button
          type="button"
          onClick={goPrev}
          disabled={stepIndex === 0}
          className="admin-btn-outline disabled:opacity-40"
        >
          Précédent
        </button>
        <span className="text-xs text-[var(--admin-muted)] hidden sm:inline">
          Étape {stepIndex + 1} / {STEPS.length}
        </span>
        <div className="flex gap-2">
          {stepIndex < STEPS.length - 1 ? (
            <>
              <button type="submit" disabled={saving} className="admin-btn-outline">
                {mode === 'create' ? 'Créer maintenant' : 'Enregistrer'}
              </button>
              <button type="button" onClick={goNext} className="admin-btn">
                Suivant
              </button>
            </>
          ) : (
            <button type="submit" disabled={saving} className="admin-btn">
              {saving ? 'Enregistrement…' : mode === 'create' ? 'Créer le coupon' : 'Enregistrer'}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
