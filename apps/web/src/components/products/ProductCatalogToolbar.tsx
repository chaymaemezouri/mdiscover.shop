'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LayoutGrid, List, Search, X } from 'lucide-react';
import type { Category } from '@/lib/api';
import { useLocale } from '@/i18n/store';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Props {
  meta: PaginationMeta;
  categories: Category[];
  view: 'grid' | 'list';
  onViewChange: (view: 'grid' | 'list') => void;
}

function buildPageUrl(params: URLSearchParams, page: number) {
  const next = new URLSearchParams(params.toString());
  if (page <= 1) next.delete('page');
  else next.set('page', String(page));
  const qs = next.toString();
  return qs ? `/products?${qs}` : '/products';
}

export function CatalogPagination({ meta }: { meta: PaginationMeta }) {
  const params = useSearchParams();
  const { t } = useLocale();
  if (meta.totalPages <= 1) return null;

  const pages = Array.from({ length: meta.totalPages }, (_, i) => i + 1).slice(0, 5);

  return (
    <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
      {pages.map((p) => (
        <Link
          key={p}
          href={buildPageUrl(params, p)}
          className={`flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-sans font-medium transition-colors ${
            p === meta.page
              ? 'border-[#A96868] bg-[#A96868] text-[#FFF9F5]'
              : 'border-[#E8D4D5] bg-white text-charcoal-700 hover:border-[#A96868] hover:text-[#A96868]'
          }`}
        >
          {p}
        </Link>
      ))}
      {meta.page < meta.totalPages && (
        <Link
          href={buildPageUrl(params, meta.page + 1)}
          className="flex h-10 items-center justify-center rounded-lg border border-[#E8D4D5] bg-white px-4 text-[10px] uppercase tracking-[0.14em] font-semibold text-charcoal-700 font-sans hover:border-[#A96868] hover:text-[#A96868] transition-colors"
        >
          {t('products.next')}
        </Link>
      )}
    </nav>
  );
}

export function ProductCatalogToolbar({ categories, view, onViewChange }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const { t, locale } = useLocale();
  const [search, setSearch] = useState(params.get('search') ?? '');

  const categoryName = (cat: Category) =>
    locale === 'en' ? cat.nameEn ?? cat.nameFr : cat.nameFr ?? cat.nameEn;

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    const qs = next.toString();
    router.push(qs ? `/products?${qs}` : '/products');
  }

  function removeKey(key: string) {
    update(key, '');
  }

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    update('search', search.trim());
  }

  const chips: { key: string; label: string }[] = [];
  const catSlug = params.get('category');
  if (catSlug) {
    const cat =
      categories.find((c) => c.slug === catSlug) ??
      categories.flatMap((c) => c.children ?? []).find((ch) => ch.slug === catSlug);
    chips.push({
      key: 'category',
      label: cat ? categoryName(cat as Category) : catSlug,
    });
  }
  if (params.get('search')) chips.push({ key: 'search', label: `"${params.get('search')}"` });
  if (params.get('isNew') === 'true') chips.push({ key: 'isNew', label: t('nav.new') });
  if (params.get('onSale') === 'true') chips.push({ key: 'onSale', label: t('products.sale') });
  if (params.get('promo') === 'true') chips.push({ key: 'promo', label: t('nav.promo') });
  if (params.get('brand')) chips.push({ key: 'brand', label: params.get('brand')! });

  return (
    <div className="mb-6 space-y-4">
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => removeKey(chip.key)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E8D4D5] bg-[#FFF9F5] px-3 py-1 text-[10px] uppercase tracking-[0.1em] text-charcoal-700 font-sans hover:border-[#A96868] hover:text-[#A96868] transition-colors"
            >
              {chip.label}
              <X size={12} />
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 pb-4 border-b border-[#E8D4D5]/80 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <form onSubmit={handleSearch} className="relative w-full min-w-0 sm:max-w-sm sm:flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B77D7E]"
            strokeWidth={1.5}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('products.searchPlaceholder')}
            aria-label={t('products.search')}
            className="w-full rounded-lg border border-[#E8D4D5] bg-white py-2.5 pl-9 pr-3 text-sm text-charcoal-900 font-sans placeholder:text-[#A89888] focus:outline-none focus:border-[#A96868] focus:ring-2 focus:ring-[#A96868]/10 transition-colors"
          />
        </form>

        <div className="grid grid-cols-2 gap-2 min-[420px]:flex min-[420px]:flex-wrap min-[420px]:items-center sm:gap-3">
          <select
            value={params.get('sort') ?? ''}
            onChange={(e) => update('sort', e.target.value)}
            className="min-w-0 w-full min-[420px]:w-auto rounded-lg border border-[#E8D4D5] bg-white px-3 py-2 text-xs text-charcoal-800 font-sans focus:outline-none focus:border-[#A96868] focus:ring-2 focus:ring-[#A96868]/10"
            aria-label="Sort products"
          >
            <option value="">{t('products.sortDefault')}</option>
            <option value="newest">{t('products.sortNewest')}</option>
            <option value="price_asc">{t('products.sortPriceAsc')}</option>
            <option value="price_desc">{t('products.sortPriceDesc')}</option>
          </select>

          <select
            value={params.get('category') ?? ''}
            onChange={(e) => update('category', e.target.value)}
            className="min-w-0 w-full min-[420px]:w-auto rounded-lg border border-[#E8D4D5] bg-white px-3 py-2 text-xs text-charcoal-800 font-sans focus:outline-none focus:border-[#A96868] focus:ring-2 focus:ring-[#A96868]/10"
            aria-label="Filter by category"
          >
            <option value="">{t('products.allCategories')}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {categoryName(cat)}
              </option>
            ))}
          </select>

          <div className="col-span-2 flex justify-end min-[420px]:col-span-1 rounded-lg border border-[#E8D4D5] bg-white overflow-hidden w-fit ml-auto">
            <button
              type="button"
              onClick={() => onViewChange('grid')}
              aria-label="Grid view"
              className={`flex h-9 w-9 items-center justify-center transition-colors ${
                view === 'grid' ? 'bg-[#A96868] text-[#FFF9F5]' : 'text-charcoal-500 hover:text-[#A96868]'
              }`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              onClick={() => onViewChange('list')}
              aria-label="List view"
              className={`flex h-9 w-9 items-center justify-center transition-colors ${
                view === 'list' ? 'bg-[#A96868] text-[#FFF9F5]' : 'text-charcoal-500 hover:text-[#A96868]'
              }`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
