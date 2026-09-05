import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/lib/api';
import { isGoldCaviarLine } from '@/components/products/ProductBrandLabel';
import { WishlistButton } from '@/components/products/WishlistButton';
import { ProductCardQuickAdd } from '@/components/products/ProductCardQuickAdd';
import { ProductCardShopImage } from '@/components/products/ProductCardShopImage';

function getOverlayLabel(product: Product, hasDiscount: boolean) {
  if (product.isBestseller) return 'Best Seller';
  if (product.isNew) return 'New';
  if (hasDiscount) return 'Sale';
  return null;
}

function ProductCardShopPlaceholder() {
  return (
    <div
      className="flex h-full items-center justify-center bg-gradient-to-b from-[#F8F2ED] to-[#FFF9F5]"
      aria-hidden
    >
      <div className="h-12 w-12 rounded-full border border-[#E8D4D5]/80 bg-white/50" />
    </div>
  );
}

function ProductCardShopBadge({ label }: { label: string }) {
  return <span className="product-card-shop-badge">{label}</span>;
}

interface ProductCardProps {
  product: Product;
  variant?: 'default' | 'shop';
  layout?: 'grid' | 'list';
}

export function ProductCard({ product, variant = 'default', layout = 'grid' }: ProductCardProps) {
  const image = product.images[0]?.url;
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const goldCaviar = isGoldCaviarLine(product.slug);
  const overlayLabel = getOverlayLabel(product, !!hasDiscount);

  if (variant === 'shop') {
    if (layout === 'list') {
      return (
        <article className="product-card-shop group flex gap-4 sm:gap-5">
          <Link
            href={`/products/${product.slug}`}
            className="product-card-shop-media relative w-28 sm:w-36 shrink-0 aspect-[4/5] overflow-hidden"
          >
            {image ? (
              <ProductCardShopImage src={image} alt={product.name} name={product.name} />
            ) : (
              <ProductCardShopPlaceholder />
            )}
            {overlayLabel && (
              <div className="absolute left-2 top-2 z-10">
                <ProductCardShopBadge label={overlayLabel} />
              </div>
            )}
          </Link>
          <div className="flex min-w-0 flex-1 flex-col py-1">
            <Link href={`/products/${product.slug}`} className="block">
              <p className="product-card-shop-eyebrow">{product.category.name}</p>
              <h3 className="font-display font-normal text-sm sm:text-base text-[#1C1714] line-clamp-2 hover:text-[#A96868] transition-colors">
                {product.name}
              </h3>
            </Link>
            <div className="product-card-shop-footer mt-auto pt-3">
              <div className="product-card-shop-price-row font-sans">
                <span className={hasDiscount ? 'text-[#A96868]' : 'text-[#1C1714]'}>
                  {formatPrice(product.price)}
                </span>
                {hasDiscount && (
                  <span className="text-[11px] font-normal text-[#A89888] line-through">
                    {formatPrice(product.compareAtPrice!)}
                  </span>
                )}
              </div>
              <ProductCardQuickAdd productId={product.id} productName={product.name} productImage={image} />
            </div>
          </div>
        </article>
      );
    }

    return (
      <article className="product-card-shop group flex h-full flex-col">
        <div className="product-card-shop-media relative aspect-[4/5] overflow-hidden">
          <Link href={`/products/${product.slug}`} className="block h-full">
            {image ? (
              <ProductCardShopImage src={image} alt={product.name} name={product.name} />
            ) : (
              <ProductCardShopPlaceholder />
            )}
          </Link>

          {overlayLabel && (
            <div className="absolute left-2 top-2 z-10 sm:left-2.5 sm:top-2.5">
              <ProductCardShopBadge label={overlayLabel} />
            </div>
          )}

          <div className="product-card-shop-actions">
            <WishlistButton
              productId={product.id}
              iconSize={14}
              ariaLabel="Add to wishlist"
              className="product-card-shop-wishlist"
            />
            <ProductCardQuickAdd
              productId={product.id}
              productName={product.name}
              productImage={image}
              variant="icon"
              iconSize={14}
              className="product-card-shop-cart"
            />
          </div>
        </div>

        <div className="product-card-shop-body flex flex-1 flex-col">
          <Link href={`/products/${product.slug}`} className="block min-h-0">
            <p className="product-card-shop-eyebrow">{product.category.name}</p>
            <h3 className="font-display font-normal text-[11px] sm:text-[13px] lg:text-[15px] text-[#1C1714] leading-snug line-clamp-2">
              {product.name}
            </h3>
          </Link>

          <div className="product-card-shop-footer mt-auto">
            <div className="product-card-shop-price-row font-sans">
              <span className={`font-semibold ${hasDiscount ? 'text-[#A96868]' : 'text-[#1C1714]'}`}>
                {formatPrice(product.price)}
              </span>
              {hasDiscount && (
                <span className="text-[9px] sm:text-[10px] font-normal text-[#A89888] line-through">
                  {formatPrice(product.compareAtPrice!)}
                </span>
              )}
            </div>
            <ProductCardQuickAdd
              productId={product.id}
              productName={product.name}
              productImage={image}
            />
          </div>
        </div>
      </article>
    );
  }

  return (
    <Link href={`/products/${product.slug}`} className="product-card group block">
      <div className="relative aspect-[3/4] bg-cream-200 overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width:768px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-cream-300">Image</div>
        )}

        {goldCaviar && (
          <div className="absolute bottom-3 left-3 right-3 rounded-sm bg-gradient-to-b from-[#E8D4C5]/95 to-[#C9A882]/95 backdrop-blur-[2px] px-3 py-2 text-center shadow-sm">
            <p className="text-[8px] uppercase tracking-[0.28em] text-[#3D2829] font-medium">MDISCOVER</p>
            <p className="font-sans text-[11px] font-medium text-[#3D2829] leading-tight mt-0.5">{product.name}</p>
          </div>
        )}

        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {product.isNew && (
            <span className="bg-charcoal-900 text-cream-50 text-[10px] uppercase tracking-widest px-2 py-1">
              Nouveau
            </span>
          )}
          {hasDiscount && (
            <span className="bg-pink-500 text-white text-[10px] uppercase tracking-widest px-2 py-1">
              Promo
            </span>
          )}
          {product.isBestseller && (
            <span className="bg-pink-600 text-white text-[10px] uppercase tracking-widest px-2 py-1">
              Bestseller
            </span>
          )}
        </div>
      </div>

      <div className="p-4 text-center">
        <p className="text-xs uppercase tracking-widest text-charcoal-400 mb-1 font-sans">{product.category.name}</p>
        <h3 className="font-display text-lg font-normal text-charcoal-900 mb-2">{product.name}</h3>
        <div className="flex items-center justify-center gap-2">
          <span className="font-sans font-medium text-charcoal-900">{formatPrice(product.price)}</span>
          {hasDiscount && (
            <span className="font-sans text-sm font-normal text-charcoal-400 line-through">
              {formatPrice(product.compareAtPrice!)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
