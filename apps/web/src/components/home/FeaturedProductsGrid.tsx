import type { Product } from '@/lib/api';
import { ProductCard } from '@/components/products/ProductCard';

interface FeaturedProductsGridProps {
  products: Product[];
  maxMobile?: number;
  maxDesktop?: number;
}

export function FeaturedProductsGrid({
  products,
  maxMobile = 8,
  maxDesktop = 10,
}: FeaturedProductsGridProps) {
  const items = products.slice(0, maxDesktop);

  return (
    <div className="featured-products-grid">
      {items.map((product, index) => (
        <div
          key={product.id}
          className={`h-full ${index >= maxMobile ? 'hidden lg:block' : ''}`}
        >
          <ProductCard product={product} variant="shop" />
        </div>
      ))}
    </div>
  );
}
