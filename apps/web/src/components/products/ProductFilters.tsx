'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { PRODUCT_BRANDS, PRODUCT_CATEGORIES } from '@mdiscovershop/shared';
import type { Brand, Category } from '@/lib/api';
import { useLocale } from '@/i18n/store';

interface Props {
  categories: Category[];
  brands?: Brand[];
}

const COLLECTION_TAGS = [
  { key: 'all', labelKey: 'products.tagAll', href: '/products' },
  { key: 'new', labelKey: 'nav.new', href: '/products?isNew=true' },
  { key: 'onSale', labelKey: 'products.sale', href: '/products?onSale=true' },
  { key: 'promo', labelKey: 'nav.promo', href: '/products?promo=true' },
] as const;

const FILTER_COLORS = ['#E8D4D5', '#A96868', '#3D2928', '#C48782', '#FFF9F5', '#B77D7E'];
const FILTER_SIZES = ['30', '50', '100', '150', '200'];

const OFFICIAL_TOP = PRODUCT_CATEGORIES.filter((c) => !c.parentSlug);
const OFFICIAL_ORDER = new Map(OFFICIAL_TOP.map((c, i) => [c.slug, i]));

function isActiveCollection(params: URLSearchParams, key: string) {
  if (key === 'all') {
    return (
      !params.get('category') &&
      !params.get('onSale') &&
      !params.get('promo') &&
      !params.get('isNew') &&
      !params.get('search')
    );
  }
  if (key === 'new') return params.get('isNew') === 'true';
  if (key === 'onSale') return params.get('onSale') === 'true';
  if (key === 'promo') return params.get('promo') === 'true';
  return false;
}

const inputClass =
  'w-full rounded-lg border border-[#E8D4D5] bg-white px-3 py-2.5 text-sm text-charcoal-900 font-sans placeholder:text-[#A89888] focus:outline-none focus:border-[#A96868] focus:ring-2 focus:ring-[#A96868]/10 transition-colors';

function categoryLabel(
  cat: { nameFr: string; nameEn?: string | null; nameAr?: string | null },
  locale: string,
) {
  if (locale === 'ar') return cat.nameAr ?? cat.nameFr;
  if (locale === 'fr') return cat.nameFr;
  return cat.nameEn ?? cat.nameFr;
}

function FilterAccordion({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-[#E8D4D5]/80 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 py-3.5 text-left"
      >
        <span className="text-[11px] uppercase tracking-[0.18em] text-[#1C1714] font-sans font-semibold">
          {title}
        </span>
        <ChevronDown
          size={16}
          strokeWidth={1.5}
          className={`shrink-0 text-[#1C1714]/70 transition-transform duration-300 ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden
        />
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="pb-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function ProductFilters({ categories, brands = [] }: Props) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const { t, locale } = useLocale();
  const [minMad, setMinMad] = useState(params.get('minPrice') ? String(Number(params.get('minPrice')) / 100) : '');
  const [maxMad, setMaxMad] = useState(params.get('maxPrice') ? String(Number(params.get('maxPrice')) / 100) : '');
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const activeCategory = params.get('category');
  const activeBrand = params.get('brand');

  const [openCategories, setOpenCategories] = useState(Boolean(activeCategory));
  const [openBrands, setOpenBrands] = useState(Boolean(activeBrand));

  const allCategories = useMemo(() => {
    // Always prefer live API categories (includes newly created ones)
    if (categories.length > 0) {
      return [...categories].sort((a, b) => {
        const ao = OFFICIAL_ORDER.get(a.slug) ?? 999;
        const bo = OFFICIAL_ORDER.get(b.slug) ?? 999;
        if (ao !== bo) return ao - bo;
        return (a.nameEn || a.nameFr).localeCompare(b.nameEn || b.nameFr, 'fr');
      });
    }

    return OFFICIAL_TOP.map((def) => ({
      id: def.slug,
      slug: def.slug,
      nameFr: def.nameFr,
      nameEn: def.nameEn,
      productCount: 0,
      children: PRODUCT_CATEGORIES.filter((c) => c.parentSlug === def.slug).map((c) => ({
        slug: c.slug,
        nameFr: c.nameFr,
        nameEn: c.nameEn,
        productCount: 0,
      })),
    })) satisfies Category[];
  }, [categories]);

  const brandList = useMemo(() => {
    if (brands.length > 0) return brands;
    return PRODUCT_BRANDS.map((b) => ({
      id: b.slug,
      slug: b.slug,
      nameEn: b.nameEn,
      nameFr: b.nameFr,
      productCount: 0,
    }));
  }, [brands]);

  const totalProducts = useMemo(
    () => categories.reduce((sum, c) => sum + c.productCount, 0),
    [categories],
  );

  function pushParams(next: URLSearchParams) {
    next.delete('page');
    const qs = next.toString();
    router.push(qs ? `/products?${qs}` : '/products');
  }

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    pushParams(next);
  }

  function applyPrice() {
    const next = new URLSearchParams(params.toString());
    if (minMad) next.set('minPrice', String(Math.round(Number(minMad) * 100)));
    else next.delete('minPrice');
    if (maxMad) next.set('maxPrice', String(Math.round(Number(maxMad) * 100)));
    else next.delete('maxPrice');
    pushParams(next);
  }

  function resetAll() {
    setMinMad('');
    setMaxMad('');
    setSelectedColor(null);
    setSelectedSize(null);
    router.push('/products');
  }

  const rowClass = (active: boolean) =>
    `flex w-full items-center justify-between gap-3 py-2 text-left text-sm font-sans transition-colors ${
      active ? 'text-[#A96868] font-semibold' : 'text-charcoal-700 hover:text-[#A96868]'
    }`;

  return (
    <aside className="w-full lg:w-[280px] xl:w-[300px] shrink-0">
      <button
        type="button"
        onClick={() => setMobileFiltersOpen((v) => !v)}
        aria-expanded={mobileFiltersOpen}
        className="mb-3 flex w-full items-center justify-between gap-3 rounded-[16px] border border-[#E8D4D5]/90 bg-[#FFF9F5] px-4 py-3.5 shadow-[0_4px_16px_rgba(169,104,104,0.06)] lg:hidden"
      >
        <span className="text-[11px] uppercase tracking-[0.18em] text-[#1C1714] font-sans font-semibold">
          {t('products.filters')}
        </span>
        <ChevronDown
          size={16}
          strokeWidth={1.5}
          className={`shrink-0 text-[#1C1714]/70 transition-transform duration-300 ${
            mobileFiltersOpen ? 'rotate-180' : ''
          }`}
          aria-hidden
        />
      </button>

      <div
        className={`lg:sticky lg:top-24 space-y-6 rounded-[20px] border border-[#E8D4D5]/90 bg-[#FFF9F5] p-5 sm:p-6 shadow-[0_8px_32px_rgba(169,104,104,0.06)] ${
          mobileFiltersOpen ? 'block' : 'hidden lg:block'
        }`}
      >
        {/* Price */}
        <div>
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-charcoal-800 mb-3 font-sans font-semibold">
            {t('products.price')}
          </h3>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min={0}
              placeholder={t('products.min')}
              value={minMad}
              onChange={(e) => setMinMad(e.target.value)}
              className={inputClass}
            />
            <span className="text-charcoal-400 shrink-0">–</span>
            <input
              type="number"
              min={0}
              placeholder={t('products.max')}
              value={maxMad}
              onChange={(e) => setMaxMad(e.target.value)}
              className={inputClass}
            />
          </div>
          <button
            type="button"
            onClick={applyPrice}
            className="mt-2 w-full rounded-lg border border-[#E8D4D5] bg-white py-2 text-[10px] uppercase tracking-[0.12em] font-semibold text-[#A96868] font-sans hover:bg-[#F8F2ED] transition-colors"
          >
            {t('products.apply')}
          </button>
        </div>

        {/* Colors */}
        <div>
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-charcoal-800 mb-3 font-sans font-semibold">
            {t('products.color')}
          </h3>
          <div className="flex flex-wrap gap-2">
            {FILTER_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(selectedColor === color ? null : color)}
                className={`h-7 w-7 rounded-full border-2 transition-all ${
                  selectedColor === color ? 'border-[#A96868] scale-110 ring-2 ring-[#A96868]/20' : 'border-[#E8D4D5]'
                }`}
                style={{ backgroundColor: color }}
                aria-label={`Color ${color}`}
              />
            ))}
          </div>
        </div>

        {/* Size */}
        <div>
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-charcoal-800 mb-3 font-sans font-semibold">
            {t('products.size')}
          </h3>
          <div className="grid grid-cols-5 gap-1.5">
            {FILTER_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setSelectedSize(selectedSize === size ? null : size)}
                className={`rounded-lg border py-2 text-[11px] font-sans font-medium transition-colors ${
                  selectedSize === size
                    ? 'border-[#A96868] bg-[#A96868] text-[#FFF9F5]'
                    : 'border-[#E8D4D5] bg-white text-charcoal-600 hover:border-[#C48782]'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Categories + Brands accordions */}
        <div className="border-t border-[#E8D4D5]/70 pt-1">
          <FilterAccordion
            title={t('products.categories')}
            open={openCategories}
            onToggle={() => setOpenCategories((v) => !v)}
          >
            <ul className="space-y-0.5">
              <li>
                <button type="button" onClick={() => update('category', '')} className={rowClass(!activeCategory)}>
                  <span>{t('products.allProducts')}</span>
                  <span className="text-xs tabular-nums text-[#A89888] font-normal">({totalProducts})</span>
                </button>
              </li>
              {allCategories.map((cat) => {
                const active =
                  activeCategory === cat.slug ||
                  Boolean(cat.children?.some((ch) => ch.slug === activeCategory));
                const children = cat.children ?? [];

                return (
                  <li key={cat.id}>
                    <button
                      type="button"
                      onClick={() => update('category', cat.slug)}
                      className={rowClass(activeCategory === cat.slug || (active && children.length === 0))}
                    >
                      <span>{categoryLabel(cat, locale)}</span>
                      <span className="text-xs tabular-nums text-[#A89888] font-normal">
                        ({cat.productCount})
                      </span>
                    </button>
                    {children.length > 0 && active && (
                      <ul className="ml-3 border-l border-[#E8D4D5]/80 pl-3 mt-0.5 mb-1 space-y-0.5">
                        {children.map((child) => (
                          <li key={child.slug}>
                            <button
                              type="button"
                              onClick={() => update('category', child.slug)}
                              className={rowClass(activeCategory === child.slug)}
                            >
                              <span className="text-[13px]">{categoryLabel(child, locale)}</span>
                              {typeof child.productCount === 'number' ? (
                                <span className="text-xs tabular-nums text-[#A89888] font-normal">
                                  ({child.productCount})
                                </span>
                              ) : null}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </FilterAccordion>

          <FilterAccordion
            title={t('nav.brands')}
            open={openBrands}
            onToggle={() => setOpenBrands((v) => !v)}
          >
            <ul className="space-y-0.5">
              <li>
                <button type="button" onClick={() => update('brand', '')} className={rowClass(!activeBrand)}>
                  <span>{t('products.allProducts')}</span>
                </button>
              </li>
              {brandList.map((brand) => {
                const name =
                  locale === 'fr' ? brand.nameFr : brand.nameEn ?? brand.nameFr;
                return (
                  <li key={brand.id}>
                    <button
                      type="button"
                      onClick={() => update('brand', brand.slug)}
                      className={rowClass(activeBrand === brand.slug)}
                    >
                      <span>{name}</span>
                      {brand.productCount > 0 ? (
                        <span className="text-xs tabular-nums text-[#A89888] font-normal">
                          ({brand.productCount})
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </FilterAccordion>
        </div>

        {/* Tags */}
        <div className="border-t border-[#E8D4D5]/70 pt-5">
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-charcoal-800 mb-3 font-sans font-semibold">
            {t('products.tags')}
          </h3>
          <div className="flex flex-wrap gap-2">
            {COLLECTION_TAGS.map(({ key, labelKey, href }) => {
              const active = isActiveCollection(params, key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => router.push(href)}
                  className={`rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.1em] font-sans font-medium transition-colors ${
                    active
                      ? 'border-[#A96868] bg-[#A96868] text-[#FFF9F5]'
                      : 'border-[#E8D4D5] bg-white text-charcoal-600 hover:border-[#C48782] hover:text-[#A96868]'
                  }`}
                >
                  {t(labelKey)}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={resetAll}
          className="w-full rounded-full bg-[#A96868] py-3 text-[10px] uppercase tracking-[0.16em] font-semibold text-[#FFF9F5] font-sans shadow-[0_4px_14px_rgba(169,104,104,0.28)] hover:bg-[#9B6264] transition-colors"
        >
          {t('products.reset')}
        </button>
      </div>
    </aside>
  );
}
