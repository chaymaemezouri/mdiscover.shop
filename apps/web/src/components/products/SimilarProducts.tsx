import Link from 'next/link';
import type { Product } from '@/lib/api';
import { ProductCard } from '@/components/products/ProductCard';

interface SimilarProductsProps {
  products: Product[];
  categoryName: string;
  categorySlug: string;
}

export function SimilarProducts({ products, categoryName, categorySlug }: SimilarProductsProps) {
  if (products.length === 0) return null;

  return (
    <section className="mt-12 sm:mt-14 pt-10 border-t border-[#E8D4D5]/80">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-[#B77D7E] font-sans font-medium mb-1.5">
            Collection
          </p>
          <h2 className="font-serif text-xl sm:text-2xl lg:text-3xl text-charcoal-900 tracking-tight">
            Similar products
          </h2>
        </div>
        <Link
          href={`/products?category=${categorySlug}`}
          className="text-[10px] uppercase tracking-[0.14em] text-[#A96868] hover:text-[#9B6264] font-sans font-semibold shrink-0"
        >
          View all in {categoryName} →
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 items-stretch">
        {products.map((product) => (
          <div key={product.id} className="h-full">
            <ProductCard product={product} variant="shop" />
          </div>
        ))}
      </div>
    </section>
  );
}
