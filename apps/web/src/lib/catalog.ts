import type { Category } from '@/lib/api';
import type { Locale } from '@/i18n/translations';
import { t } from '@/i18n/translations';

type CatalogParams = {
  category?: string;
  search?: string;
  sort?: string;
  isNew?: string;
  promo?: string;
  onSale?: string;
  brand?: string;
};

export function getCatalogHeading(
  params: CatalogParams,
  categories: Category[],
  locale: Locale = 'en',
) {
  if (params.onSale === 'true') {
    return {
      eyebrow: t(locale, 'catalog.promoEyebrow'),
      title: t(locale, 'catalog.promoTitle'),
      description: t(locale, 'catalog.promoDesc'),
    };
  }

  if (params.promo === 'true') {
    return {
      eyebrow: t(locale, 'catalog.promoEyebrow'),
      title: t(locale, 'catalog.promoTagTitle'),
      description: t(locale, 'catalog.promoTagDesc'),
    };
  }

  if (params.isNew === 'true') {
    return {
      eyebrow: t(locale, 'catalog.newEyebrow'),
      title: t(locale, 'catalog.newTitle'),
      description: t(locale, 'catalog.newDesc'),
    };
  }

  if (params.search) {
    return {
      eyebrow: t(locale, 'catalog.searchEyebrow'),
      title: `« ${params.search} »`,
      description: t(locale, 'catalog.searchDesc'),
    };
  }

  if (params.category) {
    const cat = categories.find((c) => c.slug === params.category);
    const name =
      locale === 'ar'
        ? cat?.nameFr
        : locale === 'fr'
          ? cat?.nameFr
          : cat?.nameEn ?? cat?.nameFr;
    return {
      eyebrow: t(locale, 'catalog.collectionEyebrow'),
      title: name ?? t(locale, 'catalog.shopTitle'),
      description: t(locale, 'catalog.collectionDesc'),
    };
  }

  return {
    eyebrow: t(locale, 'catalog.shopEyebrow'),
    title: t(locale, 'catalog.shopTitle'),
    description: t(locale, 'catalog.shopDesc'),
  };
}
