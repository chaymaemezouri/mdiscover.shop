'use client';

import { useState } from 'react';
import type { Product, Category } from '@/lib/api';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductCatalogToolbar, CatalogPagination, type PaginationMeta } from '@/components/products/ProductCatalogToolbar';
import { useLocale } from '@/i18n/store';

interface Props {
  products: Product[];
  meta: PaginationMeta;
  categories: Category[];
}

export function ProductCatalogContent({ products, meta, categories }: Props) {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const { t } = useLocale();

  return (
    <>
      <ProductCatalogToolbar meta={meta} categories={categories} view={view} onViewChange={setView} />

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center rounded-[20px] bg-[#FFF9F5] border border-[#E8D4D5]/90 px-6">
          <p className="font-serif text-xl sm:text-2xl text-[#1C1714] mb-2">{t('products.noResults')}</p>
          <p className="text-sm text-[#6B625A] font-sans max-w-sm">{t('products.noResultsHint')}</p>
        </div>
      ) : (
        <>
          <div
            className={
              view === 'grid'
                ? 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4 items-stretch'
                : 'flex flex-col gap-3 sm:gap-4'
            }
          >
            {products.map((product) => (
              <div key={product.id} className={view === 'list' ? 'max-w-3xl' : 'h-full'}>
                <ProductCard product={product} variant="shop" layout={view} />
              </div>
            ))}
          </div>

          <CatalogPagination meta={meta} />
        </>
      )}
    </>
  );
}
