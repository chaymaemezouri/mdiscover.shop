'use client';

import Link from 'next/link';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { useLocale } from '@/i18n/store';
import { useAccountModal } from '@/store/accountModal';
import { APP_NAME } from '@mdiscovershop/shared';
import { storeWhatsAppUrl } from '@/lib/contact';

const WHATSAPP_URL = storeWhatsAppUrl(
  'Hello, I would like information about your mDISCOVER products.',
);
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.511-5.16c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const linkClass =
  'text-[#6B625A] hover:text-[#A96868] transition-colors duration-300 font-sans text-[13px] sm:text-sm';

const headingClass =
  'text-[#3D2928] uppercase text-[10px] tracking-[0.18em] sm:tracking-[0.22em] font-semibold mb-2.5 sm:mb-4 font-sans';

export function Footer() {
  const { t } = useLocale();
  const openAccount = useAccountModal((s) => s.open);

  return (
    <footer className="bg-white text-[#3D2928] border-t border-[#E8D4D5]/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-14 md:py-16">
        {/* Brand — compact on mobile */}
        <div className="mb-6 sm:mb-10 md:mb-0 md:hidden">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="inline-block min-w-0" aria-label={APP_NAME}>
              <BrandLogo className="h-8 w-auto object-contain" />
            </Link>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('hero.whatsapp')}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E8D4D5] text-[#25D366] hover:border-[#25D366]/40 hover:bg-[#25D366]/8 transition-colors"
            >
              <WhatsAppIcon className="h-4 w-4" />
            </a>
          </div>
          <p className="mt-2.5 text-[12.5px] leading-snug text-[#6B625A] font-sans line-clamp-2">
            {t('footer.tagline')}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:gap-8 md:grid-cols-3 md:gap-10">
          {/* Brand — desktop / tablet */}
          <div className="hidden md:block col-span-1">
            <Link href="/" className="inline-block mb-4" aria-label={APP_NAME}>
              <BrandLogo className="h-9 sm:h-10 w-auto object-contain" />
            </Link>
            <p className="text-sm text-[#6B625A] leading-relaxed font-sans">
              {t('footer.tagline')}
            </p>
            <div className="flex gap-3 mt-6">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('hero.whatsapp')}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E8D4D5] text-[#25D366] hover:border-[#25D366]/40 hover:bg-[#25D366]/8 transition-colors"
              >
                <WhatsAppIcon className="h-[18px] w-[18px]" />
              </a>
            </div>
          </div>

          <div>
            <h4 className={headingClass}>{t('footer.shop')}</h4>
            <ul className="space-y-1.5 sm:space-y-2.5">
              <li><Link href="/products" className={linkClass}>{t('nav.catalog')}</Link></li>
              <li><Link href="/products?category=serums" className={linkClass}>{t('nav.serums')}</Link></li>
              <li><Link href="/products?category=face-cream" className={linkClass}>{t('nav.creams')}</Link></li>
              <li><Link href="/products?category=product-sets" className={linkClass}>{t('nav.sets')}</Link></li>
              <li><Link href="/products?category=parfums" className={linkClass}>{t('nav.perfumes')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className={headingClass}>{t('footer.help')}</h4>
            <ul className="space-y-1.5 sm:space-y-2.5">
              <li><Link href="/pages/faq" className={linkClass}>{t('footer.faq')}</Link></li>
              <li><Link href="/contact" className={linkClass}>{t('footer.contact')}</Link></li>
              <li>
                <button type="button" onClick={() => openAccount('login')} className={`${linkClass} text-left`}>
                  {t('nav.account')}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-[#E8D4D5]/80 py-3.5 sm:py-6 text-center text-[10px] sm:text-[11px] tracking-[0.06em] text-[#9B6264] font-sans">
        © {new Date().getFullYear()} {APP_NAME}. {t('footer.rights')}
      </div>
    </footer>
  );
}
