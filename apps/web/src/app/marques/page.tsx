import Link from 'next/link';
import { api } from '@/lib/api';

export const metadata = { title: 'Brands' };

async function getBrands() {
  try {
    return await api.brands.list();
  } catch {
    return [];
  }
}

export default async function BrandsPage() {
  const brands = await getBrands();

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 sm:py-16">
      <h1 className="section-title mb-2">Brands</h1>
      <p className="text-charcoal-500 mb-10">Discover our partner brands.</p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {brands.map((brand) => (
          <Link
            key={brand.id}
            href={`/products?brand=${brand.slug}`}
            className="group border border-cream-300 bg-white p-6 rounded-2xl hover:border-pink-300 hover:shadow-md transition-all duration-300"
          >
            <h2 className="text-sm uppercase tracking-[0.16em] font-semibold text-charcoal-900 group-hover:text-pink-600 transition-colors">
              {brand.nameEn}
            </h2>
            <p className="mt-2 text-xs text-charcoal-500">{brand.productCount} products</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
