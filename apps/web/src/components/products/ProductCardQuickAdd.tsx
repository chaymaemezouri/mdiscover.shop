'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';
import { api } from '@/lib/api';
import { useCartStore } from '@/store/cart';
import { getSessionId } from '@/lib/utils';
import { useLocale } from '@/i18n/store';

interface Props {
  productId: string;
  productName?: string;
  productImage?: string;
  variant?: 'button' | 'icon';
  className?: string;
  iconSize?: number;
}

export function ProductCardQuickAdd({
  productId,
  productName,
  productImage,
  variant = 'button',
  className,
  iconSize = 14,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const { setCartId, setItemCount, notifyAdded } = useCartStore();
  const { t } = useLocale();
  const router = useRouter();

  async function handleAdd(buyNow = false) {
    setLoading(true);
    try {
      const sessionId = getSessionId();
      const cart = await api.cart.addItem(sessionId, {
        productId,
        quantity: 1,
      });
      setCartId(cart.id);
      setItemCount(cart.itemCount);
      notifyAdded({
        productName: productName ?? 'Product',
        productImage,
        quantity: 1,
      });

      if (buyNow) {
        router.push('/panier');
        return;
      }

      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={() => void handleAdd(false)}
        disabled={loading}
        aria-label={t('products.addToCart')}
        className={className ?? 'product-card-shop-cart'}
      >
        <ShoppingBag
          size={iconSize}
          strokeWidth={1.5}
          className={added ? 'text-[#A96868]' : 'text-[#3A322C]'}
        />
      </button>
    );
  }

  const label = loading
    ? t('common.adding')
    : added
      ? t('common.added')
      : t('products.buyNow');

  return (
    <button
      type="button"
      onClick={() => void handleAdd(true)}
      disabled={loading}
      className="product-card-shop-buy w-full disabled:opacity-60"
    >
      {label}
    </button>
  );
}
