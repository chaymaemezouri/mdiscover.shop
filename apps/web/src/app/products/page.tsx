import Link from 'next/link';
import { Suspense } from 'react';
import { api } from '@/lib/api';
import { getCatalogHeading } from '@/lib/catalog';
import { getServerLocale } from '@/lib/locale-server';
import { ProductFilters } from '@/components/products/ProductFilters';
import { ProductCatalogContent } from '@/components/products/ProductCatalogContent';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Props {
  searchParams: {
    category?: string;
    search?: string;
    sort?: string;
    page?: string;
    isNew?: string;
    promo?: string;
    onSale?: string;
    brand?: string;
    minPrice?: string;
    maxPrice?: string;
  };
}

async function getProducts(params: Props['searchParams']) {
  try {
    const query: Record<string, string> = { limit: '12' };
    if (params.category) query.category = params.category;
    if (params.search) query.search = params.search;
    if (params.sort) query.sort = params.sort;
    if (params.page) query.page = params.page;
    if (params.isNew) query.isNew = params.isNew;
    if (params.promo) query.isPromo = params.promo;
    if (params.onSale) query.onSale = params.onSale;
    if (params.brand) query.brand = params.brand;
    if (params.minPrice) query.minPrice = params.minPrice;
    if (params.maxPrice) query.maxPrice = params.maxPrice;
    return await api.products.list(query);
  } catch {
    return { data: [], meta: { total: 0, page: 1, limit: 12, totalPages: 0 } };
  }
}

async function getCategories() {
  try {
    return await api.categories.list();
  } catch {
    return [];
  }
}

async function getBrands() {
  try {
    return await api.brands.list();
  } catch {
    return [];
  }
}

function categoryDisplayName(
  categories: Awaited<ReturnType<typeof getCategories>>,
  slug: string,
  locale: string,
) {
  const cat =
    categories.find((c) => c.slug === slug) ??
    categories.flatMap((c) => c.children ?? []).find((ch) => ch.slug === slug);
  if (!cat) return slug;
  if (locale === 'fr') return cat.nameFr;
  return cat.nameEn ?? cat.nameFr;
}

export async function generateMetadata({ searchParams }: Props) {
  const locale = await getServerLocale();
  const categories = await getCategories();
  const { title } = getCatalogHeading(searchParams, categories, locale);
  return { title };
}

export default async function ProductsPage({ searchParams }: Props) {
  const locale = await getServerLocale();
  const [productsResult, categories, brands] = await Promise.all([
    getProducts(searchParams),
    getCategories(),
    getBrands(),
  ]);

  const heading = getCatalogHeading(searchParams, categories, locale);
  const activeCategorySlug = searchParams.category;
  const activeCategoryName = activeCategorySlug
    ? categoryDisplayName(categories, activeCategorySlug, locale)
    : null;

  return (
    <div className="bg-[#FBF8F4] min-h-screen w-full">
      {/* Page header */}
      <section className="relative w-full overflow-hidden border-b border-[#E8D4D5]/80 bg-[#FFF9F5]">
        <div className="relative w-full px-3 sm:px-8 lg:px-10 xl:px-14 py-7 sm:py-12">
          <nav className="text-[11px] text-charcoal-500 mb-3 sm:mb-4 font-sans flex flex-wrap items-center gap-y-1">
            <Link href="/products" className="hover:text-[#A96868] transition-colors">
              Catalog
            </Link>
            {activeCategoryName ? (
              <>
                <span className="mx-2 text-[#E8D4D5]">/</span>
                <span className="text-charcoal-900 truncate max-w-[70vw]">{activeCategoryName}</span>
              </>
            ) : (
              <>
                <span className="mx-2 text-[#E8D4D5]">/</span>
                <span className="text-charcoal-900 truncate max-w-[70vw]">{heading.title}</span>
              </>
            )}
          </nav>
          <h1 className="font-serif text-[clamp(1.65rem,5.5vw,2.75rem)] text-[#1C1714] tracking-tight">
            {heading.title}
          </h1>
        </div>
      </section>

      {/* Sidebar + catalog */}
      <div className="w-full px-3 sm:px-8 lg:px-10 xl:px-14 py-6 sm:py-10 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-5 sm:gap-8 lg:gap-10 xl:gap-12">
          <Suspense
            fallback={
              <div className="w-full lg:w-[280px] h-96 rounded-[20px] bg-[#E8D4D5]/30 animate-pulse shrink-0" />
            }
          >
            <ProductFilters categories={categories} brands={brands} />
          </Suspense>

          <div className="flex-1 min-w-0">
            <Suspense fallback={<div className="h-64 animate-pulse rounded-[20px] bg-[#E8D4D5]/30" />}>
              <ProductCatalogContent
                products={productsResult.data}
                meta={productsResult.meta}
                categories={categories}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
