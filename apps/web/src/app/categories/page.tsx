import Link from 'next/link';
import { api } from '@/lib/api';

export const metadata = { title: 'Categories' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getCategories() {
  try {
    return await api.categories.list();
  } catch {
    return [];
  }
}

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 sm:py-16">
      <h1 className="section-title mb-2">Categories</h1>
      <p className="text-charcoal-500 mb-10">Browse our skincare collections.</p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="border border-cream-300 bg-white p-6 rounded-2xl hover:border-pink-300 hover:shadow-md transition-all duration-300"
          >
            <Link href={`/products?category=${cat.slug}`} className="group block">
              <h2 className="text-sm uppercase tracking-[0.16em] font-semibold text-charcoal-900 group-hover:text-pink-600 transition-colors">
                {cat.nameEn ?? cat.nameFr}
              </h2>
              <p className="mt-2 text-xs text-charcoal-500">{cat.productCount} products</p>
            </Link>
            {cat.children && cat.children.length > 0 && (
              <ul className="mt-4 space-y-2 border-t border-cream-200 pt-4">
                {cat.children.map((child) => (
                  <li key={child.slug}>
                    <Link
                      href={`/products?category=${child.slug}`}
                      className="text-xs uppercase tracking-[0.12em] text-charcoal-600 hover:text-pink-600 transition-colors"
                    >
                      {child.nameEn ?? child.nameFr}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
