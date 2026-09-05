'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Lock, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { api, type Cart } from '@/lib/api';
import { formatPrice, getSessionId } from '@/lib/utils';
import { useCartStore } from '@/store/cart';
import { useLocale } from '@/i18n/store';

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const { setItemCount } = useCartStore();
  const { t } = useLocale();

  useEffect(() => {
    api.cart
      .get(getSessionId())
      .then((c) => {
        setCart(c);
        setItemCount(c.itemCount);
      })
      .catch(() => setCart(null))
      .finally(() => setLoading(false));
  }, [setItemCount]);

  function syncCart(next: Cart) {
    setCart(next);
    setItemCount(next.itemCount);
  }

  async function updateQuantity(itemId: string, quantity: number) {
    if (!cart) return;
    setUpdatingId(itemId);
    try {
      const next = await api.cart.updateItem(cart.id, getSessionId(), itemId, quantity);
      syncCart(next);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error updating cart');
    } finally {
      setUpdatingId(null);
    }
  }

  async function removeItem(itemId: string) {
    if (!cart) return;
    setUpdatingId(itemId);
    try {
      const next = await api.cart.removeItem(cart.id, getSessionId(), itemId);
      syncCart(next);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error removing item');
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <div className="w-full min-h-[50vh] flex items-center justify-center bg-[#FBF8F4] text-charcoal-500 font-sans">
        {t('cart.loading')}
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center bg-[#FBF8F4] px-4 py-20 text-center">
        <ShoppingBag size={40} className="text-[#E8D4D5] mb-4" strokeWidth={1.25} />
        <h1 className="font-serif text-2xl sm:text-3xl text-charcoal-900 mb-2">{t('cart.empty')}</h1>
        <p className="text-sm text-charcoal-500 font-sans mb-8 max-w-sm">
          {t('cart.emptyDesc')}
        </p>
        <Link
          href="/products"
          className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-[#A96868] px-8 text-[10px] uppercase tracking-[0.16em] font-semibold text-[#FFF9F5] font-sans shadow-[0_4px_14px_rgba(169,104,104,0.28)] hover:bg-[#9B6264] transition-colors"
        >
          {t('cart.shopNow')}
        </Link>
      </div>
    );
  }

  const total = cart.subtotal;
  const checkoutHref = `/checkout?cartId=${cart.id}${note.trim() ? `&note=${encodeURIComponent(note.trim())}` : ''}`;

  return (
    <div className="w-full min-h-screen bg-white">
      <div className="grid w-full lg:grid-cols-[minmax(0,1fr)_minmax(300px,28vw)] xl:grid-cols-[minmax(0,1fr)_420px] min-h-screen">
        {/* Products */}
        <div className="px-4 sm:px-8 lg:px-10 xl:px-14 py-8 sm:py-10 lg:py-12">
          <div className="hidden md:grid grid-cols-[minmax(0,1.6fr)_100px_120px_100px_40px] gap-4 pb-4 border-b border-[#E8D4D5]/80 text-[10px] uppercase tracking-[0.18em] text-charcoal-400 font-sans font-medium">
            <span>{t('cart.product')}</span>
            <span className="text-center">{t('cart.price')}</span>
            <span className="text-center">{t('cart.qty')}</span>
            <span className="text-right">{t('cart.total')}</span>
            <span className="sr-only">{t('cart.removeItem')}</span>
          </div>

          <div className="divide-y divide-[#E8D4D5]/80">
            {cart.items.map((item) => {
              const lineTotal = item.unitPrice * item.quantity;
              const isUpdating = updatingId === item.id;

              return (
                <div
                  key={item.id}
                  className="py-6 sm:py-8 grid grid-cols-1 md:grid-cols-[minmax(0,1.6fr)_100px_120px_100px_40px] gap-4 md:items-center"
                >
                  <div className="flex gap-4 min-w-0">
                    <div className="relative w-[88px] h-[100px] sm:w-24 sm:h-28 shrink-0 bg-[#F8F2ED] overflow-hidden">
                      {item.product.image ? (
                        <Image
                          src={item.product.image}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[#E8D4D5]">
                          <ShoppingBag size={22} strokeWidth={1.25} />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex items-start justify-between gap-3">
                        <Link
                          href={`/products/${item.product.slug}`}
                          className="font-sans text-sm sm:text-base font-bold text-charcoal-900 hover:text-[#A96868] transition-colors line-clamp-2"
                        >
                          {item.product.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          disabled={isUpdating}
                          aria-label={t('cart.removeItem')}
                          title={t('cart.removeItem')}
                          className="md:hidden flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-charcoal-400 hover:text-[#A96868] hover:bg-[#FFF9F5] transition-colors disabled:opacity-50"
                        >
                          <Trash2 size={15} strokeWidth={1.6} />
                        </button>
                      </div>
                      <p className="mt-1 text-[11px] text-charcoal-400 font-sans">#{item.productId.slice(0, 12)}</p>
                      {item.variant?.name && (
                        <p className="mt-0.5 text-[11px] text-charcoal-500 font-sans">
                          {t('cart.size')}: {item.variant.name}
                        </p>
                      )}
                      <p className="mt-2 md:hidden text-sm font-semibold text-charcoal-900 font-sans">
                        {formatPrice(lineTotal)}
                      </p>
                    </div>
                  </div>

                  <p className="hidden md:block text-center text-sm text-charcoal-900 font-sans">
                    {formatPrice(item.unitPrice)}
                  </p>

                  <div className="flex md:justify-center items-center gap-3">
                    <span className="md:hidden text-[10px] uppercase tracking-[0.14em] text-charcoal-400 font-sans w-8">
                      {t('cart.qty')}
                    </span>
                    <div className="inline-flex items-center rounded-full border border-[#E8D4D5] bg-white overflow-hidden shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={isUpdating}
                        aria-label={t('cart.decreaseQty')}
                        className="flex h-9 w-9 items-center justify-center text-charcoal-600 hover:bg-[#F8F2ED] transition-colors disabled:opacity-50"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold text-charcoal-900 font-sans">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={isUpdating}
                        aria-label={t('cart.increaseQty')}
                        className="flex h-9 w-9 items-center justify-center bg-[#A96868] text-[#FFF9F5] hover:bg-[#9B6264] transition-colors disabled:opacity-50"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  <p className="hidden md:block text-right text-sm font-semibold text-charcoal-900 font-sans">
                    {formatPrice(lineTotal)}
                  </p>

                  <div className="hidden md:flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      disabled={isUpdating}
                      aria-label={t('cart.removeItem')}
                      title={t('cart.removeItem')}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-charcoal-400 hover:text-[#A96868] hover:bg-[#FFF9F5] transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={15} strokeWidth={1.6} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-10 sm:mt-12 max-w-xl">
            <label
              htmlFor="cart-note"
              className="block text-[10px] uppercase tracking-[0.18em] text-charcoal-400 font-sans font-medium mb-3"
            >
              {t('cart.addNote')}
            </label>
            <textarea
              id="cart-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('cart.notePlaceholder')}
              rows={3}
              className="w-full rounded-3xl border border-[#E8D4D5] bg-[#FBF8F4] px-5 py-4 text-sm text-charcoal-900 font-sans placeholder:text-[#A89888] focus:outline-none focus:border-[#A96868] focus:ring-2 focus:ring-[#A96868]/10 transition-colors resize-none"
            />
          </div>
        </div>

        {/* Summary sidebar */}
        <aside className="relative flex flex-col bg-gradient-to-b from-[#FFF9F5] to-[#F8F2ED] border-t lg:border-t-0 lg:border-l border-[#E8D4D5] lg:min-h-screen overflow-hidden">
          <div className="h-2 sm:h-2.5 bg-[#A96868] shrink-0" />

          <div className="relative flex flex-1 flex-col px-6 sm:px-8 py-8 sm:py-10">
            <div className="mb-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-charcoal-500 font-sans font-medium">
                {t('cart.cartTotal')}
              </p>
              <p className="mt-2 font-serif text-3xl sm:text-4xl text-[#A96868] tracking-tight">
                {formatPrice(total)}
              </p>
            </div>

            <label className="mt-8 flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#E8D4D5] text-[#A96868] focus:ring-[#A96868]/20"
              />
              <span className="text-[11px] leading-relaxed text-charcoal-600 font-sans">
                {t('cart.agreeTerms')}{' '}
                <Link href="/pages/terms" className="italic text-[#A96868] hover:text-[#9B6264] transition-colors">
                  {t('cart.termsLink')}
                </Link>
              </span>
            </label>

            {agreedTerms ? (
              <Link
                href={checkoutHref}
                className="mt-8 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#A96868] text-[#FFF9F5] text-[11px] uppercase tracking-[0.18em] font-semibold font-sans shadow-[0_4px_14px_rgba(169,104,104,0.28)] hover:bg-[#9B6264] hover:shadow-[0_6px_18px_rgba(169,104,104,0.34)] transition-all"
              >
                {t('cart.checkout')}
                <Lock size={14} strokeWidth={2} />
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="mt-8 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#A96868]/35 text-[#FFF9F5]/90 text-[11px] uppercase tracking-[0.18em] font-semibold font-sans cursor-not-allowed"
              >
                {t('cart.checkout')}
                <Lock size={14} strokeWidth={2} />
              </button>
            )}

            <button
              type="button"
              disabled
              className="mt-3 flex min-h-[48px] w-full items-center justify-center rounded-full border border-[#E8D4D5] bg-white text-sm font-semibold text-[#B77D7E] font-sans opacity-80 cursor-not-allowed"
            >
              {t('cart.paypal')}
            </button>

            <div className="mt-8 space-y-2 border-t border-[#E8D4D5]/80 pt-6 text-[11px] text-charcoal-500 font-sans">
              <div className="flex justify-between">
                <span>{t('cart.subtotal')}</span>
                <span>{formatPrice(cart.subtotal)}</span>
              </div>
            </div>

            <Link
              href="/products"
              className="mt-6 text-[10px] uppercase tracking-[0.14em] text-[#A96868] hover:text-[#9B6264] font-sans font-semibold"
            >
              {t('cart.continueShopping')}
            </Link>

            <ShoppingBag
              size={180}
              strokeWidth={0.75}
              className="pointer-events-none absolute -bottom-8 -right-6 text-[#A96868]/12 hidden sm:block"
              aria-hidden
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
