'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart } from 'lucide-react';
import { AccountShell } from '@/components/account/AccountShell';
import { formatPrice } from '@/lib/utils';
import { getAccessToken } from '@/lib/auth-client';
import { useWishlistStore } from '@/store/wishlist';

interface WishlistItem {
  id: string;
  productId: string;
  product: { slug: string; name: string; price: number; image?: string };
}

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const setWishlist = useWishlistStore((s) => s.setWishlist);
  const removeProductId = useWishlistStore((s) => s.removeProductId);

  function load() {
    const token = getAccessToken();
    if (!token) {
      window.location.href = '/compte';
      return;
    }
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/wishlist`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data: WishlistItem[]) => {
        const list = Array.isArray(data) ? data : [];
        setItems(list);
        setWishlist(list.map((item) => item.productId));
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(productId: string) {
    const token = getAccessToken();
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/wishlist/${productId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    removeProductId(productId);
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  }

  return (
    <AccountShell title="Wishlist">
      {loading ? (
        <p className="text-center text-charcoal-500 font-sans py-12">Loading...</p>
      ) : items.length === 0 ? (
        <div className="rounded-[20px] border border-[#E8D4D5] bg-[#FFF9F5] px-6 py-16 text-center shadow-[0_8px_32px_rgba(169,104,104,0.06)]">
          <p className="text-charcoal-500 font-sans">No favorites yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="flex gap-4 rounded-[20px] border border-[#E8D4D5] bg-[#FFF9F5] p-4 shadow-[0_8px_32px_rgba(169,104,104,0.06)]"
            >
              <div className="relative w-20 h-24 shrink-0 overflow-hidden rounded-xl bg-[#F8F2ED]">
                {item.product.image && (
                  <Image src={item.product.image} alt={item.product.name} fill className="object-cover" sizes="80px" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/products/${item.product.slug}`}
                  className="font-sans text-sm font-semibold text-charcoal-900 hover:text-[#A96868] transition-colors line-clamp-2"
                >
                  {item.product.name}
                </Link>
                <p className="mt-1 font-sans text-sm font-semibold text-charcoal-900">
                  {formatPrice(item.product.price)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(item.productId)}
                className="shrink-0 self-start text-[#A96868] hover:text-[#9B6264] p-1 transition-colors"
                aria-label="Remove from wishlist"
              >
                <Heart size={18} fill="currentColor" />
              </button>
            </article>
          ))}
        </div>
      )}
    </AccountShell>
  );
}
