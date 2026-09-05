'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useWishlistStore } from '@/store/wishlist';
import { useAccountModal } from '@/store/accountModal';

interface Props {
  productId: string;
  className?: string;
  iconSize?: number;
  ariaLabel?: string;
}

export function WishlistButton({ productId, className, iconSize = 20, ariaLabel }: Props) {
  const active = useWishlistStore((s) => s.productIds.includes(productId));
  const addProductId = useWishlistStore((s) => s.addProductId);
  const removeProductId = useWishlistStore((s) => s.removeProductId);
  const openAccount = useAccountModal((s) => s.open);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    const token = localStorage.getItem('access_token');
    if (!token) {
      openAccount('login');
      return;
    }
    setLoading(true);
    try {
      if (active) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/wishlist/${productId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) removeProductId(productId);
      } else {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/wishlist`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId }),
        });
        if (res.ok || res.status === 409) addProductId(productId);
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={ariaLabel ?? 'Ajouter aux favoris'}
      className={
        className ??
        'p-3 border border-cream-300 hover:border-pink-500 transition-colors'
      }
    >
      <Heart size={iconSize} className={active ? 'fill-pink-500 text-pink-500' : 'text-charcoal-600'} />
    </button>
  );
}
