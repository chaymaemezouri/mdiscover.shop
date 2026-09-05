'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ShoppingBag, Menu, X, Heart, Search, User } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { SearchBar } from '@/components/layout/SearchBar';
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher';
import { useCartStore } from '@/store/cart';
import { useWishlistStore } from '@/store/wishlist';
import { useAccountModal } from '@/store/accountModal';
import { useLocale } from '@/i18n/store';
import { APP_NAME } from '@mdiscovershop/shared';
import { NAV_I18N_KEYS } from '@/i18n/translations';

const NAV_ICON = { size: 22, strokeWidth: 1.55 };

function isNavLinkActive(href: string, pathname: string, searchParams: URLSearchParams) {
  const [path, queryString] = href.split('?');
  if (pathname !== path) return false;
  if (!queryString) return !searchParams.toString();
  const expected = new URLSearchParams(queryString);
  for (const [key, value] of expected.entries()) {
    if (searchParams.get(key) !== value) return false;
  }
  return true;
}

type HeroNavBarProps = {
  variant?: 'hero' | 'page';
};

function hasNavHref(
  link: (typeof NAV_I18N_KEYS)[number] & { label: string },
): link is (typeof NAV_I18N_KEYS)[number] & { label: string; href: string } {
  return 'href' in link;
}

export function HeroNavBar({ variant = 'page' }: HeroNavBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileQuery, setMobileQuery] = useState('');
  const itemCount = useCartStore((s) => s.itemCount);
  const cartBadgePulse = useCartStore((s) => s.cartBadgePulse);
  const wishlistCount = useWishlistStore((s) => s.count);
  const wishlistBadgePulse = useWishlistStore((s) => s.badgePulse);
  const syncWishlist = useWishlistStore((s) => s.syncFromApi);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const openAccountModal = useAccountModal((s) => s.open);
  const { t } = useLocale();

  useEffect(() => {
    void syncWishlist();
  }, [syncWishlist, pathname]);

  function handleAccountClick() {
    if (typeof window !== 'undefined' && localStorage.getItem('access_token')) {
      router.push('/compte/commandes');
      return;
    }
    openAccountModal('login');
  }

  const navLinks = NAV_I18N_KEYS.map((link) => ({
    ...link,
    label: t(link.key),
  }));

  const iconBtn =
    variant === 'hero'
      ? 'hero-icon-btn hero-header-icon flex shrink-0 items-center justify-center rounded-full transition-all duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1C1714]/25'
      : 'flex items-center justify-center w-12 h-12 min-w-[48px] min-h-[48px] sm:w-11 sm:h-11 sm:min-w-[44px] sm:min-h-[44px] rounded-full text-[#3A322C] hover:bg-[#EDE5DC] transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-400';

  const navLinkClass = (active: boolean) =>
    variant === 'hero'
      ? `hero-nav-link group relative uppercase font-semibold font-sans transition-all duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] whitespace-nowrap ${
          active ? 'text-[#1C1714]' : 'text-[#1C1714]/78 hover:text-[#1C1714]'
        }`
      : `group relative text-[11px] xl:text-[12px] tracking-[0.18em] uppercase font-semibold transition-colors duration-300 whitespace-nowrap ${
          active ? 'text-[#1C1714]' : 'text-[#6B625A] hover:text-[#1C1714]'
        }`;

  function submitMobileSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!mobileQuery.trim()) return;
    router.push(`/products?q=${encodeURIComponent(mobileQuery.trim())}`);
    setMobileQuery('');
    setMobileOpen(false);
  }

  return (
    <div className={`relative w-full ${variant === 'hero' ? 'hero-animate-nav' : ''}`}>
      <div className="relative flex w-full items-center justify-between gap-2 hero-nav-row">
        <Link href="/" className="relative z-10 flex items-center shrink-0 py-1.5 min-w-0" aria-label={APP_NAME}>
          <BrandLogo
            className={
              variant === 'hero'
                ? 'hero-logo h-10 sm:h-10 md:h-11 w-auto object-contain'
                : 'h-10 sm:h-10 md:h-11 w-auto object-contain'
            }
          />
        </Link>

        <nav
          className={`${
            variant === 'hero' ? 'hero-nav-links' : 'hidden lg:flex gap-5 xl:gap-6'
          } absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 items-center`}
        >
          {navLinks.map((link) => {
            if (!hasNavHref(link)) return null;

            const active = isNavLinkActive(link.href, pathname, searchParams);

            return (
              <Link key={link.href} href={link.href} className={navLinkClass(active)}>
                {link.label}
                <span
                  className={`absolute -bottom-2 left-1/2 -translate-x-1/2 h-px transition-all duration-300 ${
                    variant === 'hero' ? 'bg-[#1C1714]' : 'bg-pink-500'
                  } ${active ? 'w-full opacity-80' : 'w-0 opacity-0 group-hover:w-full group-hover:opacity-50'}`}
                />
              </Link>
            );
          })}
        </nav>

        <div className="relative z-10 ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1.5 md:gap-2">
          {/* Search lives in the mobile menu below lg to avoid crowding the icon row */}
          <div className="hidden lg:block">
            <SearchBar variant="popover" tone={variant === 'hero' ? 'hero' : 'page'} />
          </div>

          <Link
            href="/compte/wishlist"
            aria-label={t('nav.wishlist')}
            className={`${iconBtn} relative hidden sm:flex`}
          >
            <Heart size={NAV_ICON.size} strokeWidth={NAV_ICON.strokeWidth} />
            {wishlistCount > 0 && (
              <span className={`hero-cart-badge absolute top-1.5 right-1.5 min-w-[16px] h-[16px] px-0.5 bg-[#FFF9F5] text-[#182B38] text-[9px] rounded-full flex items-center justify-center font-medium leading-none ring-1 ring-[#A96868]/25 ${wishlistBadgePulse ? 'animate-cart-badge-pop' : ''}`}>
                {wishlistCount > 99 ? '99+' : wishlistCount}
              </span>
            )}
          </Link>

          <Link href="/panier" aria-label={t('nav.cart')} className={`${iconBtn} relative`}>
            <ShoppingBag size={NAV_ICON.size} strokeWidth={NAV_ICON.strokeWidth} />
            {itemCount > 0 && (
              <span className={`hero-cart-badge absolute top-1.5 right-1.5 min-w-[16px] h-[16px] px-0.5 bg-[#FFF9F5] text-[#182B38] text-[9px] rounded-full flex items-center justify-center font-medium leading-none ring-1 ring-[#A96868]/25 ${cartBadgePulse ? 'animate-cart-badge-pop' : ''}`}>
                {itemCount}
              </span>
            )}
          </Link>

          <button type="button" onClick={handleAccountClick} aria-label={t('nav.account')} className={iconBtn}>
            <User size={NAV_ICON.size} strokeWidth={NAV_ICON.strokeWidth} />
          </button>

          <div className="hidden md:block">
            <LocaleSwitcher className={iconBtn} iconSize={NAV_ICON.size} strokeWidth={NAV_ICON.strokeWidth} />
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`${iconBtn} lg:hidden`}
            aria-label={t('nav.menu')}
          >
            {mobileOpen ? (
              <X size={NAV_ICON.size} strokeWidth={NAV_ICON.strokeWidth} />
            ) : (
              <Menu size={NAV_ICON.size} strokeWidth={NAV_ICON.strokeWidth} />
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          className={`mt-4 pt-4 space-y-0.5 animate-hero-fade lg:hidden ${
            variant === 'hero'
              ? 'border-t border-[#1C1714]/10 bg-[#FFF9F5]/40 backdrop-blur-sm px-2 py-2'
              : 'border-t border-[#E4DAD0]'
          }`}
        >
          <form
            onSubmit={submitMobileSearch}
            className={`mb-3 flex items-center gap-2 border px-3 py-2.5 ${
              variant === 'hero'
                ? 'rounded-full border-[#1C1714]/15 bg-white/50'
                : 'border-[#E8D4D5] bg-white'
            }`}
          >
            <Search
              size={14}
              className={variant === 'hero' ? 'text-[#1C1714]/70' : 'text-[#B77D7E]'}
              strokeWidth={NAV_ICON.strokeWidth}
            />
            <input
              value={mobileQuery}
              onChange={(e) => setMobileQuery(e.target.value)}
              placeholder={t('nav.search')}
              className={`w-full bg-transparent text-xs outline-none font-sans ${
                variant === 'hero'
                  ? 'text-[#1C1714] placeholder:text-[#1C1714]/45'
                  : 'text-charcoal-900 placeholder:text-[#A89888]'
              }`}
            />
          </form>
          {navLinks.map((link) => {
            if (!hasNavHref(link)) return null;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2.5 text-[11px] tracking-[0.16em] uppercase font-semibold rounded-xl transition-colors font-sans ${
                  variant === 'hero'
                    ? 'text-[#1C1714] font-bold hover:bg-black/5'
                    : 'text-[#3A322C] hover:bg-[#EDE5DC]'
                }`}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/compte/wishlist"
            className={`flex items-center gap-2 px-3 py-2.5 text-[11px] tracking-[0.16em] uppercase font-semibold rounded-xl transition-colors font-sans sm:hidden ${
              variant === 'hero'
                ? 'text-[#1C1714] font-bold hover:bg-black/5'
                : 'text-[#3A322C] hover:bg-[#EDE5DC]'
            }`}
            onClick={() => setMobileOpen(false)}
          >
            <Heart size={14} strokeWidth={NAV_ICON.strokeWidth} />
            {t('nav.wishlist')}
          </Link>
          <div className="px-3 pt-3 pb-1 md:hidden">
            <LocaleSwitcher
              iconSize={NAV_ICON.size}
              strokeWidth={NAV_ICON.strokeWidth}
              className={
                variant === 'hero'
                  ? 'hero-icon-btn hero-header-icon flex items-center justify-center rounded-full'
                  : 'flex items-center justify-center w-12 h-12 rounded-full text-[#3A322C] hover:bg-[#EDE5DC]'
              }
            />
          </div>
        </nav>
      )}
    </div>
  );
}
