'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Minus, Plus, Star, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { formatPrice, getSessionId } from '@/lib/utils';
import { useCartStore } from '@/store/cart';
import { WishlistButton } from '@/components/products/WishlistButton';

const SHADE_PRESETS = [
  '#F6E6D8',
  '#EFD3B8',
  '#E2B996',
  '#D19B72',
  '#C4876A',
  '#A96868',
  '#8F5A3C',
  '#6B3F2A',
  '#3E2418',
];

type ProductDetailData = {
  id: string;
  slug: string;
  name: string;
  shortDescription?: string;
  description?: string;
  ingredients?: string;
  usage?: string;
  price: number;
  compareAtPrice?: number;
  category: { slug: string; name: string };
  images: { url: string; alt?: string; colorHex?: string; colorName?: string }[];
  variants: {
    id: string;
    name: string;
    price: number;
    stock: number;
  }[];
  reviewCount: number;
  avgRating: number;
};

export function ProductDetailView({ product }: { product: ProductDetailData }) {
  const router = useRouter();
  const [activeImage, setActiveImage] = useState(0);
  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? '');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const { setCartId, setItemCount, notifyAdded } = useCartStore();

  const sourceImages = product.images.filter((img) => img.url);
  const thumbs = sourceImages;
  const safeIndex = thumbs.length === 0 ? 0 : Math.min(activeImage, thumbs.length - 1);
  const activeImageData = thumbs[safeIndex];
  const selected = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  const price = selected?.price ?? product.price;
  const outOfStock = selected ? selected.stock <= 0 : true;
  const ratingScore = product.avgRating > 0 ? Math.round((product.avgRating / 5) * 10) : 0;

  const displaySwatches = thumbs.map((img, index) => ({
    color: img.colorHex || SHADE_PRESETS[index % SHADE_PRESETS.length],
    name: img.colorName || undefined,
    imageIndex: index,
  }));
  const activeSwatch = displaySwatches[safeIndex];

  async function addToCart() {
    if (!selected || outOfStock) return;
    setLoading(true);
    try {
      const sessionId = getSessionId();
      const cart = await api.cart.addItem(sessionId, {
        productId: product.id,
        variantId: selected.id,
        quantity,
      });
      setCartId(cart.id);
      setItemCount(cart.itemCount);
      setAdded(true);
      notifyAdded({
        productName: product.name,
        productImage: activeImageData?.url,
        quantity,
      });
      setTimeout(() => setAdded(false), 2200);
      return true;
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToCart() {
    await addToCart();
  }

  async function handleBuyNow() {
    const ok = await addToCart();
    if (ok) router.push('/panier');
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:gap-8 xl:gap-10 items-stretch w-full">
      {/* Gallery */}
      <div className="flex h-full flex-col rounded-[20px] bg-[#FFF9F5] border border-[#E8D4D5] p-3 sm:p-4 shadow-[0_8px_32px_rgba(169,104,104,0.08)]">
        <div className="relative flex-1 min-h-[280px] sm:min-h-[320px] lg:min-h-[360px] w-full overflow-hidden rounded-[16px] bg-gradient-to-b from-[#F8F2ED] via-[#FFF9F5] to-[#E8D4D5]/50">
          {activeImageData?.url ? (
            <Image
              key={activeImageData.url}
              src={activeImageData.url}
              alt={activeImageData.alt ?? product.name}
              fill
              className="object-contain p-4 sm:p-6"
              sizes="50vw"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[#A89888] text-sm font-sans">
              No image
            </div>
          )}
          {activeSwatch && (
            <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-white/90 backdrop-blur px-2.5 py-1.5 shadow-sm border border-[#E8D4D5]">
              <span
                className="h-4 w-4 rounded-full border border-[#E8D4D5]"
                style={{ backgroundColor: activeSwatch.color }}
              />
              <span className="text-[11px] font-sans text-charcoal-700">
                {activeSwatch.name || activeSwatch.color}
              </span>
            </div>
          )}
        </div>

        {displaySwatches.length > 0 && (
          <div className="mt-3 shrink-0 flex flex-wrap justify-center items-center gap-2">
            {displaySwatches.map((swatch, index) => (
              <button
                key={`${swatch.color}-${index}`}
                type="button"
                title={swatch.name || swatch.color}
                onClick={() => setActiveImage(swatch.imageIndex)}
                aria-label={swatch.name || `Teinte ${index + 1}`}
                aria-current={safeIndex === swatch.imageIndex ? 'true' : undefined}
                className={`h-7 w-7 rounded-full border-2 transition-shadow ${
                  safeIndex === swatch.imageIndex
                    ? 'border-[#A96868] ring-2 ring-[#A96868]/40 ring-offset-1'
                    : 'border-white shadow hover:scale-105'
                }`}
                style={{ backgroundColor: swatch.color }}
              />
            ))}
          </div>
        )}

        {thumbs.length > 1 && (
          <div className="mt-3 shrink-0 flex justify-center gap-2 sm:gap-2.5">
            {thumbs.map((img, i) => {
              const swatch = displaySwatches[i];
              return (
                <button
                  key={`${img.url}-${i}`}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  aria-label={`View image ${i + 1}`}
                  aria-current={i === safeIndex ? 'true' : undefined}
                  className={`relative h-14 w-14 sm:h-[4.25rem] sm:w-[4.25rem] shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                    i === safeIndex
                      ? 'border-[#A96868] shadow-[0_4px_12px_rgba(169,104,104,0.2)]'
                      : 'border-[#E8D4D5] hover:border-[#C48782] opacity-90 hover:opacity-100'
                  }`}
                >
                  <Image src={img.url} alt="" fill className="object-cover" sizes="68px" />
                  {swatch && (
                    <span
                      className="absolute bottom-1 left-1 h-3 w-3 rounded-full border border-white shadow"
                      style={{ backgroundColor: swatch.color }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Info panel */}
      <div className="flex h-full flex-col rounded-[20px] bg-[#FFF9F5] border border-[#E8D4D5] p-5 sm:p-6 lg:p-7 shadow-[0_8px_32px_rgba(169,104,104,0.06)]">
        <div className="flex-1 min-h-0">
        <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.24em] text-[#B77D7E] font-sans font-medium">
          {product.category.name}
        </p>

        <h1 className="mt-1.5 font-serif text-xl sm:text-2xl lg:text-3xl text-charcoal-900 tracking-tight leading-snug">
          {product.name}
        </h1>

        {product.reviewCount > 0 && (
          <div className="mt-2 flex items-center gap-1.5 text-[11px] sm:text-xs text-charcoal-500 font-sans">
            <Star size={13} className="fill-[#A96868] text-[#A96868]" strokeWidth={0} />
            <span className="font-medium text-charcoal-900">{ratingScore}/10</span>
            <span>·</span>
            <span>
              {product.reviewCount} review{product.reviewCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {displaySwatches.length > 0 && (
          <div className="mt-4">
            <p className="text-[9px] uppercase tracking-[0.2em] text-[#B77D7E] font-sans font-semibold mb-2">
              Teinte{activeSwatch?.name ? ` · ${activeSwatch.name}` : ''}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {displaySwatches.map((swatch, index) => (
                <button
                  key={`info-${swatch.color}-${index}`}
                  type="button"
                  title={swatch.name || swatch.color}
                  onClick={() => setActiveImage(swatch.imageIndex)}
                  className={`h-5 w-5 rounded-full border transition-shadow ${
                    safeIndex === swatch.imageIndex
                      ? 'ring-2 ring-[#A96868] ring-offset-1 border-transparent'
                      : 'border-[#E8D4D5]'
                  }`}
                  style={{ backgroundColor: swatch.color }}
                />
              ))}
            </div>
          </div>
        )}

        {product.shortDescription && (
          <p className="mt-4 text-[12px] sm:text-[13px] leading-relaxed text-charcoal-600 font-sans">
            {product.shortDescription}
          </p>
        )}

        {(product.description || product.ingredients || product.usage) && (
          <div className="mt-4 space-y-3 border-t border-[#E8D4D5] pt-4">
            {product.description && (
              <div>
                <h3 className="text-[9px] uppercase tracking-[0.2em] text-[#B77D7E] font-sans font-semibold mb-1.5">
                  Description
                </h3>
                <p className="text-[12px] leading-relaxed text-charcoal-600 font-sans">{product.description}</p>
              </div>
            )}
            {product.ingredients && (
              <div>
                <h3 className="text-[9px] uppercase tracking-[0.2em] text-[#B77D7E] font-sans font-semibold mb-1.5">
                  Ingredients (INCI)
                </h3>
                <p className="text-[12px] leading-relaxed text-charcoal-600 font-sans">{product.ingredients}</p>
              </div>
            )}
            {product.usage && (
              <div>
                <h3 className="text-[9px] uppercase tracking-[0.2em] text-[#B77D7E] font-sans font-semibold mb-1.5">
                  How to use
                </h3>
                <p className="text-[12px] leading-relaxed text-charcoal-600 font-sans">{product.usage}</p>
              </div>
            )}
          </div>
        )}

        </div>

        <div className="mt-auto shrink-0 pt-5 border-t border-[#E8D4D5]/80">
        {product.variants.length > 0 && (
          <div className="rounded-xl border border-[#E8D4D5] overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-[#E8D4D5]">
              <div className="px-3 py-2.5 bg-[#FBF8F4]/80">
                <p className="text-[8px] uppercase tracking-[0.18em] text-[#B77D7E] font-sans">Size</p>
                <p className="mt-0.5 text-[11px] font-semibold text-charcoal-900 font-sans">
                  {selected?.name ?? 'Standard'}
                </p>
              </div>
              <div className="px-3 py-2.5 bg-[#FFF9F5]">
                <p className="text-[8px] uppercase tracking-[0.18em] text-[#B77D7E] font-sans">Stock</p>
                <p className="mt-0.5 text-[11px] font-semibold text-charcoal-900 font-sans">
                  {outOfStock ? 'Out of stock' : 'In stock'}
                </p>
              </div>
            </div>
            {product.variants.length > 1 && (
              <div className="flex flex-wrap gap-1.5 p-2.5 border-t border-[#E8D4D5] bg-[#FBF8F4]/60">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVariantId(v.id)}
                    disabled={v.stock <= 0}
                    className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-wide font-sans transition-colors ${
                      variantId === v.id
                        ? 'bg-[#A96868] text-[#FFF9F5] shadow-[0_4px_12px_rgba(169,104,104,0.25)]'
                        : 'bg-white border border-[#E8D4D5] text-charcoal-600 hover:border-[#C48782] hover:text-[#A96868]'
                    } ${v.stock <= 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-end justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <span className="font-sans text-xl sm:text-2xl font-bold text-charcoal-900">
              {formatPrice(price)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > price && (
              <span className="ml-2 text-sm text-charcoal-400 line-through font-sans">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>

          <div className="flex items-center rounded-full border border-[#E8D4D5] bg-white overflow-hidden shrink-0">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex h-9 w-9 items-center justify-center text-charcoal-600 hover:bg-[#F8F2ED] transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus size={14} />
            </button>
            <span className="w-8 text-center text-sm font-semibold text-charcoal-900 font-sans">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(selected?.stock ?? 99, q + 1))}
              className="flex h-9 w-9 items-center justify-center bg-[#A96868] text-[#FFF9F5] hover:bg-[#9B6264] transition-colors"
              aria-label="Increase quantity"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={loading || outOfStock}
            className={`flex-1 min-h-[44px] rounded-full border text-[10px] uppercase tracking-[0.16em] font-semibold font-sans transition-all duration-300 disabled:opacity-50 ${
              added
                ? 'border-[#A96868] bg-[#A96868] text-[#FFF9F5] shadow-[0_4px_14px_rgba(169,104,104,0.28)] scale-[1.02]'
                : 'border-[#A96868] bg-white text-[#A96868] hover:bg-[#F8F2ED]'
            }`}
          >
            {loading ? (
              'Adding...'
            ) : added ? (
              <span className="inline-flex items-center justify-center gap-1.5 animate-cart-check-pop">
                <Check size={14} strokeWidth={2.5} />
                Added to cart
              </span>
            ) : outOfStock ? (
              'Out of stock'
            ) : (
              'Add to cart'
            )}
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={loading || outOfStock}
            className="flex-1 min-h-[44px] rounded-full bg-[#A96868] text-[#FFF9F5] text-[10px] uppercase tracking-[0.16em] font-semibold font-sans shadow-[0_4px_14px_rgba(169,104,104,0.28)] hover:bg-[#9B6264] hover:shadow-[0_6px_18px_rgba(169,104,104,0.34)] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            Buy now
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <WishlistButton
            productId={product.id}
            iconSize={18}
            ariaLabel="Add to wishlist"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E8D4D5] bg-white hover:border-[#A96868] transition-colors"
          />
          <Link
            href={`/products?category=${product.category.slug}`}
            className="text-[10px] uppercase tracking-[0.14em] text-[#A96868] hover:text-[#9B6264] font-sans"
          >
            More in {product.category.name} →
          </Link>
        </div>
        </div>
      </div>
    </div>
  );
}
