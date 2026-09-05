import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api, type Product } from '@/lib/api';
import { ProductDetailView } from '@/components/products/ProductDetailView';
import { ProductReviews } from '@/components/products/ProductReviews';
import { SimilarProducts } from '@/components/products/SimilarProducts';
import { APP_NAME } from '@mdiscovershop/shared';

interface Props {
  params: { slug: string };
}

async function getSimilarProducts(categorySlug: string, excludeId: string): Promise<Product[]> {
  const limit = 4;

  try {
    const { data: categoryProducts } = await api.products.list({
      category: categorySlug,
      limit: String(limit + 1),
    });
    const fromCategory = categoryProducts.filter((p) => p.id !== excludeId);

    if (fromCategory.length >= limit) {
      return fromCategory.slice(0, limit);
    }

    const { data: catalogProducts } = await api.products.list({ limit: '16' });
    const combined: Product[] = [...fromCategory];

    for (const product of catalogProducts) {
      if (product.id === excludeId) continue;
      if (combined.some((p) => p.id === product.id)) continue;
      combined.push(product);
      if (combined.length >= limit) break;
    }

    return combined.slice(0, limit);
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props) {
  try {
    const product = await api.products.bySlug(params.slug);
    return { title: product.name, description: product.shortDescription };
  } catch {
    return { title: 'Product' };
  }
}

export default async function ProductPage({ params }: Props) {
  let product;
  try {
    product = await api.products.bySlug(params.slug);
  } catch {
    notFound();
  }

  const similarProducts = await getSimilarProducts(product.category.slug, product.id);

  const defaultVariant = product.variants[0];
  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
      : 0;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription ?? product.description,
    image: product.images.map((i) => i.url),
    sku: defaultVariant?.sku,
    brand: { '@type': 'Brand', name: APP_NAME },
    offers: {
      '@type': 'Offer',
      price: (defaultVariant?.price ?? product.price) / 100,
      priceCurrency: 'MAD',
      availability:
        defaultVariant && defaultVariant.stock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
    },
    ...(avgRating > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: avgRating.toFixed(1),
        reviewCount: product.reviews.length,
      },
    }),
  };

  const detailProps = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    shortDescription: product.shortDescription,
    description: product.description,
    ingredients: product.ingredients,
    usage: product.usage,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    category: product.category,
    images: product.images,
    variants: product.variants.map((v) => ({
      id: v.id,
      name: v.name,
      price: v.price,
      stock: v.stock,
    })),
    reviewCount: product.reviews.length,
    avgRating,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="bg-[#FBF8F4] min-h-screen">
        <div className="w-full max-w-[100vw] px-3 sm:px-6 md:px-8 py-5 sm:py-10">
          <nav className="text-[11px] text-charcoal-500 mb-5 sm:mb-6 font-sans flex flex-wrap items-center gap-y-1 overflow-hidden">
            <Link href="/products" className="hover:text-[#A96868] transition-colors shrink-0">
              Catalog
            </Link>
            <span className="mx-2 text-[#E8D4D5] shrink-0">/</span>
            <Link
              href={`/products?category=${product.category.slug}`}
              className="hover:text-[#A96868] transition-colors shrink-0"
            >
              {product.category.name}
            </Link>
            <span className="mx-2 text-[#E8D4D5] shrink-0">/</span>
            <span className="text-charcoal-900 truncate min-w-0">{product.name}</span>
          </nav>

          <ProductDetailView product={detailProps} />

          <ProductReviews productId={product.id} />

          <SimilarProducts
            products={similarProducts}
            categoryName={product.category.name}
            categorySlug={product.category.slug}
          />
        </div>
      </div>
    </>
  );
}
