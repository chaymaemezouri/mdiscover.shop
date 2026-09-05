'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  ChevronDown,
  ImagePlus,
  Star,
  Trash2,
  Upload,
} from 'lucide-react';
import { adminApi, adminUpload, type Category } from '@/lib/api';

export type ProductImageForm = {
  url: string;
  colorHex: string;
  colorName: string;
};

export type VariantForm = {
  sku: string;
  name: string;
  price: number;
  stock: number;
  isDefault: boolean;
};

export type ProductFormState = {
  nameFr: string;
  nameEn: string;
  slug: string;
  shortDescFr: string;
  descriptionFr: string;
  ingredients: string;
  usage: string;
  precautions: string;
  basePrice: number;
  compareAtPrice: number;
  categoryId: string;
  brandId: string;
  status: string;
  isNew: boolean;
  isBestseller: boolean;
  isPromo: boolean;
  hasShippingFee: boolean;
  skinTypes: string[];
  seoTitle: string;
  seoDescription: string;
  images: ProductImageForm[];
  variants: VariantForm[];
};

export const EMPTY_PRODUCT_FORM: ProductFormState = {
  nameFr: '',
  nameEn: '',
  slug: '',
  shortDescFr: '',
  descriptionFr: '',
  ingredients: '',
  usage: '',
  precautions: '',
  basePrice: 0,
  compareAtPrice: 0,
  categoryId: '',
  brandId: '',
  status: 'DRAFT',
  isNew: false,
  isBestseller: false,
  isPromo: false,
  hasShippingFee: true,
  skinTypes: [],
  seoTitle: '',
  seoDescription: '',
  images: [],
  variants: [{ sku: '', name: '50 ml', price: 0, stock: 10, isDefault: true }],
};

const SKIN_TYPES = ['Normal', 'Sec', 'Mixte', 'Gras', 'Sensible'];

const SKIN_COLOR_PRESETS = [
  { hex: '#F6E6D8', name: 'Porcelain' },
  { hex: '#EFD3B8', name: 'Fair' },
  { hex: '#E2B996', name: 'Light' },
  { hex: '#D19B72', name: 'Light Medium' },
  { hex: '#C4876A', name: 'Medium' },
  { hex: '#A96868', name: 'Rose Medium' },
  { hex: '#8F5A3C', name: 'Tan' },
  { hex: '#6B3F2A', name: 'Deep' },
  { hex: '#3E2418', name: 'Deep Rich' },
];

type StepId = 'essentiel' | 'images' | 'variantes' | 'details' | 'seo';

const STEPS: { id: StepId; label: string; hint: string }[] = [
  { id: 'essentiel', label: '1. Essentiel', hint: 'Nom, prix, catégorie' },
  { id: 'images', label: '2. Photos', hint: 'Images & teintes' },
  { id: 'variantes', label: '3. Stock', hint: 'Variantes & quantités' },
  { id: 'details', label: '4. Détails', hint: 'Textes produit' },
  { id: 'seo', label: '5. SEO', hint: 'Optionnel' },
];

export function madToCents(v: string) {
  const n = Number(v.replace(',', '.'));
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function centsToMad(cents: number) {
  return (cents / 100).toFixed(2);
}

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
  productId?: string;
  initial?: ProductFormState;
};

export function ProductForm({ mode, productId, initial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<ProductFormState>(initial ?? EMPTY_PRODUCT_FORM);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<{ id: string; nameFr: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<StepId>('essentiel');
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [openExtra, setOpenExtra] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (initial) {
      setForm(initial);
      setSlugTouched(Boolean(initial.slug));
    }
  }, [initial]);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_ADMIN_API_URL ?? 'http://localhost:4000/api/v1';

    adminApi<Category[]>('/admin/categories')
      .catch(async () => {
        const r = await fetch(`${base}/categories`);
        if (!r.ok) return [];
        return r.json();
      })
      .then((cats) => {
        const list = Array.isArray(cats) ? cats : [];
        setCategories(list);
        setForm((f) => (f.categoryId || !list[0] ? f : { ...f, categoryId: list[0].id }));
      })
      .catch(console.error);

    adminApi<{ id: string; nameFr: string }[]>('/admin/brands')
      .catch(async () => {
        const r = await fetch(`${base}/brands`);
        if (!r.ok) return [];
        return r.json();
      })
      .then((list) => {
        const brandsList = Array.isArray(list) ? list : [];
        setBrands(brandsList);
        setForm((f) => (f.brandId || !brandsList[0] ? f : { ...f, brandId: brandsList[0].id }));
      })
      .catch(console.error);
  }, []);

  const stepDone = useMemo(
    () => ({
      essentiel: Boolean(form.nameFr.trim() && form.categoryId && form.basePrice > 0),
      images: form.images.length > 0,
      variantes: form.variants.length > 0 && form.variants.every((v) => v.name.trim()),
      details: Boolean(form.descriptionFr.trim() || form.shortDescFr.trim()),
      seo: Boolean(form.seoTitle.trim() || form.seoDescription.trim()),
    }),
    [form],
  );

  function updateVariant(index: number, patch: Partial<VariantForm>) {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v, i) => (i === index ? { ...v, ...patch } : v)),
    }));
  }

  function moveImage(from: number, to: number) {
    setForm((f) => {
      if (to < 0 || to >= f.images.length) return f;
      const next = [...f.images];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return { ...f, images: next };
    });
  }

  function setPrimary(index: number) {
    setForm((f) => {
      if (index === 0) return f;
      const next = [...f.images];
      const [item] = next.splice(index, 1);
      next.unshift(item);
      return { ...f, images: next };
    });
    setActiveImageIndex(0);
  }

  function updateImage(index: number, patch: Partial<ProductImageForm>) {
    setForm((f) => ({
      ...f,
      images: f.images.map((img, i) => (i === index ? { ...img, ...patch } : img)),
    }));
  }

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError('');
    try {
      const fileList = Array.from(files);
      const startIndex = form.images.length;
      const added: ProductImageForm[] = [];
      for (const [, file] of fileList.entries()) {
        const res = await adminUpload(file);
        added.push({ url: res.url, colorHex: '', colorName: '' });
      }
      setForm((f) => ({ ...f, images: [...f.images, ...added] }));
      setActiveImageIndex(startIndex);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload image échoué');
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e?: React.FormEvent) {
    e?.preventDefault();
    setError('');
    if (!form.nameFr.trim() || !form.categoryId) {
      setError('Nom et catégorie obligatoires');
      setStep('essentiel');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nameFr: form.nameFr.trim(),
        nameEn: form.nameEn || undefined,
        slug: form.slug || undefined,
        shortDescFr: form.shortDescFr || undefined,
        descriptionFr: form.descriptionFr || undefined,
        ingredients: form.ingredients || undefined,
        usage: form.usage || undefined,
        precautions: form.precautions || undefined,
        basePrice: form.basePrice,
        compareAtPrice: form.compareAtPrice || undefined,
        categoryId: form.categoryId,
        brandId: form.brandId || null,
        status: form.status,
        isNew: form.isNew,
        isBestseller: form.isBestseller,
        isPromo: form.isPromo,
        hasShippingFee: form.hasShippingFee,
        skinTypes: form.skinTypes,
        seoTitle: form.seoTitle || undefined,
        seoDescription: form.seoDescription || undefined,
        images: form.images.map((img) => ({
          url: img.url,
          colorHex: img.colorHex?.trim() || undefined,
          colorName: img.colorName?.trim() || undefined,
        })),
        variants: form.variants.map((v, i) => ({
          ...v,
          sku: v.sku || `SKU-${Date.now()}-${i}`,
          price: v.price || form.basePrice,
          isDefault: i === 0 ? true : v.isDefault,
        })),
      };

      if (mode === 'edit' && productId) {
        await adminApi(`/admin/products/${productId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await adminApi('/admin/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      router.push('/products');
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

  const safeImageIndex =
    form.images.length === 0 ? 0 : Math.min(activeImageIndex, form.images.length - 1);
  const previewImage = form.images[safeImageIndex];
  const stepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <form onSubmit={handleSave} className="w-full space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Link href="/products" className="admin-btn-ghost mt-0.5">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold">
              {mode === 'create' ? 'Nouveau produit' : 'Modifier le produit'}
            </h1>
            <p className="text-sm text-[var(--admin-muted)]">
              Remplis étape par étape — seul l’essentiel est obligatoire
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

      {/* Step nav */}
      <nav className="admin-card !p-2 flex flex-wrap gap-1">
        {STEPS.map((s) => {
          const active = step === s.id;
          const done = stepDone[s.id];
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(s.id)}
              className={`flex-1 min-w-[120px] rounded-md px-3 py-2 text-left transition-colors ${
                active
                  ? 'bg-[var(--admin-rose)] text-white'
                  : 'hover:bg-black/[0.04] text-[var(--admin-black)]'
              }`}
            >
              <span className="flex items-center gap-1.5 text-sm font-medium">
                {done && !active && <Check size={13} className="text-[var(--admin-rose)]" />}
                {s.label}
              </span>
              <span className={`block text-[11px] mt-0.5 ${active ? 'text-white/80' : 'text-[var(--admin-muted)]'}`}>
                {s.hint}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ─── 1. Essentiel ─── */}
      {step === 'essentiel' && (
        <section className="admin-card space-y-4">
          <div>
            <h2 className="text-sm font-semibold">Essentiel</h2>
            <p className="text-xs text-[var(--admin-muted)] mt-0.5">
              Ces champs suffisent pour créer le produit
            </p>
          </div>

          <div>
            <label className="admin-label">Nom du produit *</label>
            <input
              required
              autoFocus
              className="admin-input text-base"
              placeholder="Ex. Sérum Gold Caviar"
              value={form.nameFr}
              onChange={(e) => {
                const nameFr = e.target.value;
                setForm((f) => ({
                  ...f,
                  nameFr,
                  slug: slugTouched ? f.slug : slugify(nameFr),
                  seoTitle: f.seoTitle || nameFr,
                }));
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="admin-label">Prix (MAD) *</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                className="admin-input"
                placeholder="299.00"
                value={form.basePrice ? centsToMad(form.basePrice) : ''}
                onChange={(e) => {
                  const basePrice = madToCents(e.target.value);
                  setForm((f) => ({
                    ...f,
                    basePrice,
                    variants: f.variants.map((v, i) =>
                      i === 0 && (!v.price || v.price === f.basePrice)
                        ? { ...v, price: basePrice }
                        : v,
                    ),
                  }));
                }}
              />
            </div>
            <div>
              <label className="admin-label">Prix barré</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="admin-input"
                placeholder="Optionnel"
                value={form.compareAtPrice ? centsToMad(form.compareAtPrice) : ''}
                onChange={(e) => setForm({ ...form, compareAtPrice: madToCents(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="admin-label">Catégorie *</label>
              <select
                required
                className="admin-input"
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              >
                <option value="">— Choisir —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameFr}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="admin-label">Marque</label>
              <select
                className="admin-input"
                value={form.brandId}
                onChange={(e) => setForm({ ...form, brandId: e.target.value })}
              >
                <option value="">— Aucune —</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nameFr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="admin-label">Statut</label>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['DRAFT', 'Brouillon'],
                  ['PUBLISHED', 'Publié'],
                  ['ARCHIVED', 'Archivé'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm({ ...form, status: value })}
                  className={
                    form.status === value
                      ? 'admin-btn text-xs py-1.5 px-3'
                      : 'admin-btn-outline text-xs py-1.5 px-3'
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="admin-label">Badges</label>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['isNew', 'Nouveau'],
                  ['isBestseller', 'Bestseller'],
                  ['isPromo', 'Promo'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm({ ...form, [key]: !form[key] })}
                  className={
                    form[key]
                      ? 'admin-btn text-xs py-1.5 px-3'
                      : 'admin-btn-outline text-xs py-1.5 px-3'
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="admin-label">Types de peau</label>
            <div className="flex flex-wrap gap-2">
              {SKIN_TYPES.map((t) => {
                const on = form.skinTypes.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        skinTypes: on
                          ? f.skinTypes.filter((x) => x !== t)
                          : [...f.skinTypes, t],
                      }))
                    }
                    className={on ? 'admin-btn text-xs py-1 px-2.5' : 'admin-btn-outline text-xs py-1 px-2.5'}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOpenExtra((v) => !v)}
            className="flex items-center gap-1 text-xs text-[var(--admin-muted)] hover:text-[var(--admin-black)]"
          >
            <ChevronDown size={14} className={`transition-transform ${openExtra ? 'rotate-180' : ''}`} />
            Options avancées (slug, nom EN, livraison)
          </button>

          {openExtra && (
            <div className="space-y-3 pt-1 border-t border-[var(--admin-line)]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="admin-label">Nom (EN)</label>
                  <input
                    className="admin-input"
                    value={form.nameEn}
                    onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                  />
                </div>
                <div>
                  <label className="admin-label">Slug URL</label>
                  <input
                    className="admin-input"
                    value={form.slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setForm({ ...form, slug: e.target.value });
                    }}
                    placeholder="auto depuis le nom"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.hasShippingFee}
                  onChange={(e) => setForm({ ...form, hasShippingFee: e.target.checked })}
                />
                Appliquer les frais de livraison
              </label>
            </div>
          )}
        </section>
      )}

      {/* ─── 2. Images ─── */}
      {step === 'images' && (
        <section className="admin-card space-y-4">
          <div>
            <h2 className="text-sm font-semibold">Photos & teintes</h2>
            <p className="text-xs text-[var(--admin-muted)] mt-0.5">
              Ajoute des photos librement. La teinte est optionnelle (utile pour les nuances).
              Première image = principale boutique.
            </p>
          </div>

          <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[var(--admin-line)] bg-black/[0.02] py-8 cursor-pointer hover:border-[var(--admin-rose)] hover:bg-[var(--admin-rose-soft)] transition-colors">
            <Upload size={22} className="text-[var(--admin-rose)]" />
            <span className="text-sm font-medium">
              {uploading ? 'Upload en cours…' : 'Déposer ou choisir des images'}
            </span>
            <span className="text-xs text-[var(--admin-muted)]">Teinte optionnelle — tu peux laisser sans couleur</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                void uploadFiles(e.target.files);
                e.target.value = '';
              }}
            />
          </label>

          {previewImage ? (
            <div className="space-y-3">
              <div className="aspect-[4/3] max-h-80 rounded-lg border border-[var(--admin-line)] overflow-hidden bg-black/[0.03] relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewImage.url}
                  alt={previewImage.colorName || 'Aperçu'}
                  className="w-full h-full object-cover transition-opacity"
                />
                <div className="absolute top-2 left-2 flex items-center gap-2">
                  {safeImageIndex === 0 && (
                    <span className="text-[10px] font-medium bg-[var(--admin-rose)] text-white px-2 py-0.5 rounded">
                      Principale
                    </span>
                  )}
                  {(previewImage.colorHex || previewImage.colorName) && (
                    <span className="text-[10px] font-medium bg-black/70 text-white px-2 py-0.5 rounded flex items-center gap-1.5">
                      {previewImage.colorHex ? (
                        <span
                          className="w-3 h-3 rounded-full border border-white/80"
                          style={{ backgroundColor: previewImage.colorHex }}
                        />
                      ) : null}
                      {previewImage.colorName || previewImage.colorHex}
                    </span>
                  )}
                </div>
              </div>

              {/* Teintes — only images that have a color */}
              {form.images.some((img) => img.colorHex) && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-[var(--admin-muted)] mr-1">Teintes :</span>
                  {form.images.map((img, i) => {
                    if (!img.colorHex) return null;
                    const active = i === safeImageIndex;
                    return (
                      <button
                        key={`swatch-${img.url}-${i}`}
                        type="button"
                        title={img.colorName || img.colorHex}
                        onClick={() => setActiveImageIndex(i)}
                        className={`w-8 h-8 rounded-full border-2 transition-shadow ${
                          active
                            ? 'border-[var(--admin-black)] ring-2 ring-[var(--admin-rose)] ring-offset-1'
                            : 'border-white shadow'
                        }`}
                        style={{ backgroundColor: img.colorHex }}
                      />
                    );
                  })}
                </div>
              )}

              {/* Thumbnails */}
              <div className="flex flex-wrap gap-2">
                {form.images.map((img, i) => (
                    <button
                      key={`thumb-${img.url}-${i}`}
                      type="button"
                      onClick={() => setActiveImageIndex(i)}
                      className={`relative w-16 h-16 rounded-md overflow-hidden border-2 ${
                        i === safeImageIndex
                          ? 'border-[var(--admin-rose)]'
                          : 'border-[var(--admin-line)]'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                      {img.colorHex ? (
                        <span
                          className="absolute bottom-1 left-1 w-3.5 h-3.5 rounded-full border border-white shadow"
                          style={{ backgroundColor: img.colorHex }}
                        />
                      ) : null}
                    </button>
                  ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 py-6 text-[var(--admin-muted)] text-sm">
              <ImagePlus size={18} className="opacity-50" />
              Aucune image pour l’instant
            </div>
          )}

          {form.images.length > 0 && (
            <ul className="space-y-2">
              {form.images.map((img, i) => {
                const hasColor = Boolean(img.colorHex?.trim());
                return (
                  <li
                    key={`${img.url}-${i}`}
                    className={`flex gap-3 rounded-md border p-2.5 cursor-pointer ${
                      i === safeImageIndex
                        ? 'border-[var(--admin-rose)] bg-[var(--admin-rose-soft)]'
                        : 'border-[var(--admin-line)]'
                    }`}
                    onClick={() => setActiveImageIndex(i)}
                  >
                    <div className="relative w-14 h-14 shrink-0 rounded overflow-hidden border border-[var(--admin-line)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                      {hasColor ? (
                        <span
                          className="absolute bottom-0.5 left-0.5 w-3 h-3 rounded-full border border-white"
                          style={{ backgroundColor: img.colorHex }}
                        />
                      ) : null}
                    </div>
                    <div
                      className="flex-1 min-w-0 space-y-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={hasColor ? img.colorHex : '#F6E6D8'}
                          onChange={(e) => {
                            updateImage(i, { colorHex: e.target.value });
                            setActiveImageIndex(i);
                          }}
                          className="w-7 h-7 rounded border border-[var(--admin-line)] cursor-pointer bg-transparent p-0 shrink-0"
                          title="Teinte (optionnel)"
                        />
                        <input
                          className="admin-input text-xs py-1.5"
                          placeholder="Nom teinte (optionnel)"
                          value={img.colorName}
                          onChange={(e) => {
                            updateImage(i, { colorName: e.target.value });
                            setActiveImageIndex(i);
                          }}
                        />
                        {hasColor || img.colorName ? (
                          <button
                            type="button"
                            className="text-[10px] text-[var(--admin-muted)] hover:text-[var(--admin-rose)] shrink-0 underline"
                            onClick={() => {
                              updateImage(i, { colorHex: '', colorName: '' });
                              setActiveImageIndex(i);
                            }}
                          >
                            Aucune
                          </button>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-[10px] text-[var(--admin-muted)] mr-1">Optionnel :</span>
                        {SKIN_COLOR_PRESETS.map((preset) => (
                          <button
                            key={preset.hex}
                            type="button"
                            title={preset.name}
                            onClick={() => {
                              updateImage(i, { colorHex: preset.hex, colorName: preset.name });
                              setActiveImageIndex(i);
                            }}
                            className={`w-4 h-4 rounded-full border ${
                              hasColor && img.colorHex.toLowerCase() === preset.hex.toLowerCase()
                                ? 'border-[var(--admin-black)] ring-1 ring-[var(--admin-black)]'
                                : 'border-black/15'
                            }`}
                            style={{ backgroundColor: preset.hex }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {i !== 0 && (
                        <button type="button" title="Principale" onClick={() => setPrimary(i)} className="admin-btn-ghost px-1.5">
                          <Star size={13} />
                        </button>
                      )}
                      <button type="button" title="Monter" onClick={() => moveImage(i, i - 1)} className="admin-btn-ghost px-1.5">
                        <ArrowUp size={13} />
                      </button>
                      <button type="button" title="Descendre" onClick={() => moveImage(i, i + 1)} className="admin-btn-ghost px-1.5">
                        <ArrowDown size={13} />
                      </button>
                      <button
                        type="button"
                        title="Supprimer"
                        onClick={() => {
                          setForm((f) => ({ ...f, images: f.images.filter((_, j) => j !== i) }));
                          setActiveImageIndex((prev) => {
                            if (prev === i) return Math.max(0, i - 1);
                            if (prev > i) return prev - 1;
                            return prev;
                          });
                        }}
                        className="admin-btn-ghost px-1.5 text-red-600"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <Link href="/media" className="inline-block text-xs text-[var(--admin-rose)] hover:underline">
            Médiathèque →
          </Link>
        </section>
      )}

      {/* ─── 3. Variantes ─── */}
      {step === 'variantes' && (
        <section className="admin-card space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold">Variantes & stock</h2>
              <p className="text-xs text-[var(--admin-muted)] mt-0.5">
                Volume, SKU, prix et quantité
              </p>
            </div>
            <button
              type="button"
              className="admin-btn-outline text-xs py-1.5"
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  variants: [
                    ...f.variants,
                    { sku: '', name: '', price: f.basePrice, stock: 0, isDefault: false },
                  ],
                }))
              }
            >
              + Variante
            </button>
          </div>

          <div className="space-y-3">
            {form.variants.map((v, i) => (
              <div
                key={i}
                className="rounded-md border border-[var(--admin-line)] p-3 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--admin-muted)]">
                    Variante {i + 1}
                    {i === 0 ? ' · défaut' : ''}
                  </span>
                  {form.variants.length > 1 && (
                    <button
                      type="button"
                      className="admin-btn-ghost text-red-600 text-xs"
                      onClick={() =>
                        setForm((f) => ({ ...f, variants: f.variants.filter((_, j) => j !== i) }))
                      }
                    >
                      <Trash2 size={14} /> Retirer
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="admin-label">Nom / volume</label>
                    <input
                      className="admin-input"
                      value={v.name}
                      onChange={(e) => updateVariant(i, { name: e.target.value })}
                      placeholder="50 ml"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="admin-label">SKU</label>
                    <input
                      className="admin-input"
                      value={v.sku}
                      onChange={(e) => updateVariant(i, { sku: e.target.value })}
                      placeholder="Auto si vide"
                    />
                  </div>
                  <div>
                    <label className="admin-label">Prix (MAD)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="admin-input"
                      value={v.price ? centsToMad(v.price) : ''}
                      onChange={(e) => updateVariant(i, { price: madToCents(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="admin-label">Stock</label>
                    <input
                      type="number"
                      className="admin-input"
                      value={v.stock}
                      onChange={(e) => updateVariant(i, { stock: parseInt(e.target.value, 10) || 0 })}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── 4. Détails ─── */}
      {step === 'details' && (
        <section className="admin-card space-y-4">
          <div>
            <h2 className="text-sm font-semibold">Détails produit</h2>
            <p className="text-xs text-[var(--admin-muted)] mt-0.5">Optionnel — enrichit la fiche boutique</p>
          </div>
          <div>
            <label className="admin-label">Résumé court</label>
            <input
              className="admin-input"
              placeholder="Une phrase pour les listes"
              value={form.shortDescFr}
              onChange={(e) => setForm({ ...form, shortDescFr: e.target.value })}
            />
          </div>
          <div>
            <label className="admin-label">Description</label>
            <textarea
              className="admin-input min-h-[120px]"
              placeholder="Présentation complète…"
              value={form.descriptionFr}
              onChange={(e) => setForm({ ...form, descriptionFr: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="admin-label">Ingrédients (INCI)</label>
              <textarea
                className="admin-input min-h-[100px]"
                value={form.ingredients}
                onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
              />
            </div>
            <div>
              <label className="admin-label">Mode d&apos;emploi</label>
              <textarea
                className="admin-input min-h-[100px]"
                value={form.usage}
                onChange={(e) => setForm({ ...form, usage: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="admin-label">Précautions</label>
            <textarea
              className="admin-input min-h-[70px]"
              value={form.precautions}
              onChange={(e) => setForm({ ...form, precautions: e.target.value })}
            />
          </div>
        </section>
      )}

      {/* ─── 5. SEO ─── */}
      {step === 'seo' && (
        <section className="admin-card space-y-4">
          <div>
            <h2 className="text-sm font-semibold">SEO</h2>
            <p className="text-xs text-[var(--admin-muted)] mt-0.5">Optionnel — Google & réseaux</p>
          </div>
          <div>
            <label className="admin-label">Titre SEO</label>
            <input
              className="admin-input"
              value={form.seoTitle}
              onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
              placeholder={form.nameFr || 'Titre de la page'}
            />
          </div>
          <div>
            <label className="admin-label">Meta description</label>
            <textarea
              className="admin-input min-h-[90px]"
              value={form.seoDescription}
              onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
              placeholder={form.shortDescFr || 'Courte description pour les résultats de recherche'}
            />
            <p className="text-[11px] text-[var(--admin-muted)] mt-1">
              {form.seoDescription.length}/160 caractères recommandés
            </p>
          </div>
        </section>
      )}

      {/* Sticky footer — stays in content column */}
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
              {saving ? 'Enregistrement…' : mode === 'create' ? 'Créer le produit' : 'Enregistrer'}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
