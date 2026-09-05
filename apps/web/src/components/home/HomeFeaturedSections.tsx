'use client';

import Link from 'next/link';
import type { Product } from '@/lib/api';
import { FeaturedProductsGrid } from '@/components/home/FeaturedProductsGrid';
import { useLocale } from '@/i18n/store';

export function HomeNewProducts({ products }: { products: Product[] }) {
  const { t } = useLocale();
  if (products.length === 0) return null;

  return (
    <section className="w-full px-3 sm:px-6 md:px-8 py-10 sm:py-14 md:py-16">
      <div className="flex items-end justify-between mb-5 sm:mb-8 md:mb-10 gap-3 sm:gap-4">
        <h2 className="section-title min-w-0 text-[clamp(1.35rem,4.5vw,2rem)]">{t('home.newArrivals')}</h2>
        <Link
          href="/products?sort=newest"
          className="text-xs sm:text-sm uppercase tracking-[0.14em] text-[#A96868] hover:text-[#9B6264] shrink-0 font-sans font-medium"
        >
          {t('home.viewAll')}
        </Link>
      </div>
      <FeaturedProductsGrid products={products} maxMobile={4} maxDesktop={10} />
    </section>
  );
}

export function HomeBestsellers({ products }: { products: Product[] }) {
  const { t } = useLocale();
  if (products.length === 0) return null;

  return (
    <section className="w-full px-3 sm:px-6 md:px-8 py-10 sm:py-14 md:py-16">
      <div className="flex items-end justify-between mb-5 sm:mb-8 md:mb-10 gap-3 sm:gap-4">
        <h2 className="section-title min-w-0 text-[clamp(1.35rem,4.5vw,2rem)]">{t('home.bestsellers')}</h2>
        <Link
          href="/products?sort=popular"
          className="text-xs sm:text-sm uppercase tracking-[0.14em] text-[#A96868] hover:text-[#9B6264] shrink-0 font-sans font-medium"
        >
          {t('home.viewAll')}
        </Link>
      </div>
      <FeaturedProductsGrid products={products} maxMobile={4} maxDesktop={10} />
    </section>
  );
}
