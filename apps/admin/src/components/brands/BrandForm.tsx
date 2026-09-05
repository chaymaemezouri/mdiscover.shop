'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { adminApi } from '@/lib/api';

export type BrandFormState = {
  nameFr: string;
  nameEn: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
};

export const EMPTY_BRAND: BrandFormState = {
  nameFr: '',
  nameEn: '',
  slug: '',
  sortOrder: 0,
  isActive: true,
};

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

type Props = {
  mode: 'create' | 'edit';
  brandId?: string;
  initial?: BrandFormState;
};

export function BrandForm({ mode, brandId, initial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<BrandFormState>(initial ?? EMPTY_BRAND);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initial) {
      setForm(initial);
      setSlugTouched(Boolean(initial.slug));
    }
  }, [initial]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.nameFr.trim()) {
      setError('Nom obligatoire');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nameFr: form.nameFr.trim(),
        nameEn: form.nameEn.trim() || form.nameFr.trim(),
        slug: form.slug.trim() || undefined,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      };
      if (mode === 'edit' && brandId) {
        await adminApi(`/admin/brands/${brandId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await adminApi('/admin/brands', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      router.push('/brands');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="w-full max-w-xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Link href="/brands" className="admin-btn-ghost mt-0.5">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold">
              {mode === 'create' ? 'Nouvelle marque' : 'Modifier la marque'}
            </h1>
            <p className="text-sm text-[var(--admin-muted)]">
              Liée au site (/marques) et aux filtres produits
            </p>
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

      <section className="admin-card space-y-4">
        <div>
          <label className="admin-label">Nom (FR) *</label>
          <input
            required
            autoFocus
            className="admin-input"
            value={form.nameFr}
            onChange={(e) => {
              const nameFr = e.target.value;
              setForm((f) => ({
                ...f,
                nameFr,
                nameEn: f.nameEn || nameFr,
                slug: slugTouched ? f.slug : slugify(nameFr),
              }));
            }}
          />
        </div>
        <div>
          <label className="admin-label">Nom (EN)</label>
          <input
            className="admin-input"
            value={form.nameEn}
            onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
          />
        </div>
        <div>
          <label className="admin-label">Slug</label>
          <input
            className="admin-input font-mono text-xs"
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true);
              setForm({ ...form, slug: e.target.value });
            }}
          />
          <p className="text-[11px] text-[var(--admin-muted)] mt-1">
            Utilisé dans l’URL boutique : /products?brand=…
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="admin-label">Ordre</label>
            <input
              type="number"
              className="admin-input"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) || 0 })}
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
        </div>
      </section>
    </form>
  );
}
