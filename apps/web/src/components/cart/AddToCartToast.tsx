'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Check, ShoppingBag, X } from 'lucide-react';
import { useCartStore } from '@/store/cart';

export function AddToCartToast() {
  const notification = useCartStore((s) => s.notification);
  const clearNotification = useCartStore((s) => s.clearNotification);

  if (!notification) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-[100] w-[min(calc(100vw-1.5rem),24rem)] -translate-x-1/2 animate-cart-toast-in"
    >
      <div className="flex items-center gap-3 rounded-[18px] border border-[#E8D4D5] bg-[#FFF9F5] p-3 shadow-[0_16px_48px_rgba(169,104,104,0.18)]">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[#E8D4D5] bg-[#F8F2ED]">
          {notification.productImage ? (
            <Image
              src={notification.productImage}
              alt=""
              fill
              className="object-cover"
              sizes="56px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#E8D4D5] to-[#C48782]">
              <ShoppingBag size={20} className="text-[#FFF9F5]/90" strokeWidth={1.35} />
            </div>
          )}
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#A96868] text-[#FFF9F5] animate-cart-check-pop">
            <Check size={11} strokeWidth={2.5} />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.16em] text-[#A96868] font-sans font-semibold">
            Added to cart
          </p>
          <p className="mt-0.5 truncate font-sans text-sm font-semibold text-charcoal-900">
            {notification.productName}
          </p>
          <p className="text-[11px] text-charcoal-500 font-sans">
            Qty: {notification.quantity}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <button
            type="button"
            onClick={clearNotification}
            aria-label="Dismiss"
            className="flex h-7 w-7 items-center justify-center rounded-full text-charcoal-400 hover:bg-[#F8F2ED] hover:text-charcoal-700 transition-colors"
          >
            <X size={14} />
          </button>
          <Link
            href="/panier"
            onClick={clearNotification}
            className="text-[10px] uppercase tracking-[0.12em] text-[#A96868] hover:text-[#9B6264] font-sans font-semibold whitespace-nowrap"
          >
            View cart →
          </Link>
        </div>
      </div>
    </div>
  );
}
