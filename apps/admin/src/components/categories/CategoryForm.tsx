'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ImagePlus, Upload, X } from 'lucide-react';
import { adminApi, adminUpload } from '@/lib/api';
import { categoryImageSrc } from '@/lib/category-image';

export type CategoryFormState = {
  nameFr: string;
  nameEn: string;
  slug: string;
  description: string;
  imageUrl: string;
  parentId: string;
  sortOrder: number;
  isActive: boolean;
};

export const EMPTY_CATEGORY_FORM: CategoryFormState = {
  nameFr: '',
  nameEn: '',
  slug: '',
  description: '',
  imageUrl: '',
  parentId: '',
  sortOrder: 0,
  isActive: true,
};

export type CategoryOption = {
  id: string;
  nameFr: string;
  parentId?: string | null;
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

type StepId = 'essentiel' | 'image' | 'details';

const STEPS: { id: StepId; label: string; hint: string }[] = [
  { id: 'essentiel', label: '1. Essentiel', hint: 'Nom, parent, statut' },
  { id: 'image', label: '2. Image', hint: 'Visuel boutique' },
  { id: 'details', label: '3. Détails', hint: 'Description & ordre' },
];

type Props = {
  mode: 'create' | 'edit';
  categoryId?: string;
  initial?: CategoryFormState;
  excludeParentIds?: string[];
};

export function CategoryForm({ mode, categoryId, initial, excludeParentIds = [] }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<CategoryFormState>(initial ?? EMPTY_CATEGORY_FORM);
  const [parents, setParents] = useState<CategoryOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<StepId>('essentiel');
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));

  useEffect(() => {
    if (initial) {
      setForm(initial);
      setSlugTouched(Boolean(initial.slug));
    }
  }, [initial]);

  useEffect(() => {
    adminApi<CategoryOption[]>('/admin/categories')
      .then((list) => setParents(Array.isArray(list) ? list : []))
      .catch(console.error);
  }, []);

  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const blockedParents = new Set([...(excludeParentIds ?? []), categoryId].filter(Boolean) as string[]);

  async function uploadImage(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const { url } = await adminUpload(file);
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload échoué');
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e?: React.FormEvent) {
    e?.preventDefault();
    setError('');
    if (!form.nameFr.trim()) {
      setError('Nom obligatoire');
      setStep('essentiel');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nameFr: form.nameFr.trim(),
        nameEn: form.nameEn.trim() || undefined,
        slug: form.slug.trim() || undefined,
        description: form.description.trim() || undefined,
        imageUrl: form.imageUrl || null,
        parentId: form.parentId || null,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      };

      if (mode === 'edit' && categoryId) {
        await adminApi(`/admin/categories/${categoryId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await adminApi('/admin/categories', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      router.push('/categories');
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

  return (
    <form onSubmit={handleSave} className="w-full space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Link href="/categories" className="admin-btn-ghost mt-0.5">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold">
              {mode === 'create' ? 'Nouvelle catégorie' : 'Modifier la catégorie'}
            </h1>
            <p className="text-sm text-[var(--admin-muted)]">
              Organisation boutique — image, parent et ordre d’affichage
            </p>
          </div>
        </div>
        <button type="submit" disabled={saving || uploading} className="admin-btn shrink-0">
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
              <span className={`block text-[11px] mt-0.5 ${active ? 'text-white/80' : 'text-[var(--admin-muted)]'}`}>
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
              Ces champs suffisent pour créer la catégorie
            </p>
          </div>

          <div>
            <label className="admin-label">Nom (FR) *</label>
            <input
              required
              autoFocus
              className="admin-input text-base"
              placeholder="Ex. Sérums"
              value={form.nameFr}
              onChange={(e) => {
                const nameFr = e.target.value;
                setForm((f) => ({
                  ...f,
                  nameFr,
                  slug: slugTouched ? f.slug : slugify(nameFr),
                }));
              }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="admin-label">Nom (EN)</label>
              <input
                className="admin-input"
                placeholder="Serums"
                value={form.nameEn}
                onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
              />
            </div>
            <div>
              <label className="admin-label">Slug URL</label>
              <input
                className="admin-input"
                placeholder="auto depuis le nom"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setForm({ ...form, slug: e.target.value });
                }}
              />
            </div>
          </div>

          <div>
            <label className="admin-label">Catégorie parent</label>
            <select
              className="admin-input"
              value={form.parentId}
              onChange={(e) => setForm({ ...form, parentId: e.target.value })}
            >
              <option value="">— Aucune (racine) —</option>
              {parents
                .filter((c) => !blockedParents.has(c.id))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameFr}
                  </option>
                ))}
            </select>
            <p className="text-[11px] text-[var(--admin-muted)] mt-1">
              Laisse vide pour une catégorie principale du menu
            </p>
          </div>

          <div>
            <label className="admin-label">Statut</label>
            <div className="flex flex-wrap gap-2">
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
      )}

      {step === 'image' && (
        <section className="admin-card space-y-4">
          <div>
            <h2 className="text-sm font-semibold">Image</h2>
            <p className="text-xs text-[var(--admin-muted)] mt-0.5">
              Affichée dans le carrousel et les pages catégorie
            </p>
          </div>

          <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[var(--admin-line)] bg-black/[0.02] py-10 cursor-pointer hover:border-[var(--admin-rose)] hover:bg-[var(--admin-rose-soft)] transition-colors">
            <Upload size={22} className="text-[var(--admin-rose)]" />
            <span className="text-sm font-medium">
              {uploading ? 'Upload…' : 'Choisir une image'}
            </span>
            <span className="text-xs text-[var(--admin-muted)]">JPG, PNG, WebP… jusqu’à 50 Mo</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                void uploadImage(e.target.files);
                e.target.value = '';
              }}
            />
          </label>

          {form.imageUrl ? (
            <div className="relative aspect-[16/9] max-h-80 rounded-lg border border-[var(--admin-line)] overflow-hidden bg-black/[0.03]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={categoryImageSrc(form.imageUrl, form.slug)}
                alt=""
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setForm({ ...form, imageUrl: '' })}
                className="absolute top-2 right-2 admin-btn-ghost bg-white/90 text-red-600"
                title="Retirer"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 py-8 text-[var(--admin-muted)] text-sm">
              <ImagePlus size={18} className="opacity-50" />
              Aucune image
            </div>
          )}

          <div>
            <label className="admin-label">Ou coller une URL</label>
            <input
              className="admin-input"
              placeholder="https://…"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            />
          </div>
        </section>
      )}

      {step === 'details' && (
        <section className="admin-card space-y-4">
          <div>
            <h2 className="text-sm font-semibold">Détails</h2>
            <p className="text-xs text-[var(--admin-muted)] mt-0.5">Optionnel</p>
          </div>

          <div>
            <label className="admin-label">Description</label>
            <textarea
              className="admin-input min-h-[120px]"
              placeholder="Courte présentation de la catégorie…"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="max-w-xs">
            <label className="admin-label">Ordre d’affichage</label>
            <input
              type="number"
              className="admin-input"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) || 0 })}
            />
            <p className="text-[11px] text-[var(--admin-muted)] mt-1">
              Plus petit = affiché en premier
            </p>
          </div>
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
              <button type="submit" disabled={saving || uploading} className="admin-btn-outline">
                {mode === 'create' ? 'Créer maintenant' : 'Enregistrer'}
              </button>
              <button type="button" onClick={goNext} className="admin-btn">
                Suivant
              </button>
            </>
          ) : (
            <button type="submit" disabled={saving || uploading} className="admin-btn">
              {saving ? 'Enregistrement…' : mode === 'create' ? 'Créer la catégorie' : 'Enregistrer'}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
