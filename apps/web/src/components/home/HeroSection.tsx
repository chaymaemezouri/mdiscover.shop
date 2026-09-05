'use client';

import Link from 'next/link';
import { HeroNavBar } from '@/components/layout/HeroNavBar';
import { HeroMarqueeBar } from '@/components/home/HeroMarqueeBar';
import { HeroProductHotspots } from '@/components/home/HeroProductHotspots';
import { useLocale } from '@/i18n/store';
import type { Product } from '@/lib/api';
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

interface HeroSectionProps {
  hotspotProducts?: Product[];
}

export function HeroSection({ hotspotProducts = [] }: HeroSectionProps) {
  const { t } = useLocale();

  return (
    <>
      <section
        className="hero-editorial relative isolate min-h-[100svh] h-[100svh] max-h-[100svh] w-full overflow-hidden bg-[#c4a09a]"
        aria-label="Hero"
      >
        <div className="hero-animate-bg absolute inset-0 z-0" aria-hidden>
          <div className="hero-bg-base absolute inset-0" />
          <div className="hero-bg-studio-light absolute inset-0" />
          <div className="hero-horizon absolute inset-0" />
        </div>

        <div className="hero-photo-stage absolute inset-0 z-[1]">
          <div className="hero-product-ground pointer-events-none absolute inset-x-0 bottom-0 z-[2]" aria-hidden />
          <div className="hero-photo-reflection pointer-events-none absolute inset-x-0 bottom-0 z-[2]" aria-hidden />
          <div
            className="hero-desktop-photo absolute inset-0 hidden md:block pointer-events-none"
            role="img"
            aria-label="mDISCOVER skincare — serum, cream, lotion and concentrate"
          />
          <div
            className="hero-mobile-photo absolute inset-0 md:hidden pointer-events-none"
            role="img"
            aria-label="mDISCOVER luxury skincare — hero product"
          />
          <div className="hero-atmosphere-overlay pointer-events-none absolute inset-0" aria-hidden />
          <div className="hero-photo-depth pointer-events-none absolute inset-0" aria-hidden />
          <div className="hero-cream-halo pointer-events-none absolute inset-0" aria-hidden />
          <div className="hero-mobile-vignette pointer-events-none absolute inset-0 md:hidden" aria-hidden />
          <div className="hidden">
            <HeroProductHotspots products={hotspotProducts} />
          </div>
        </div>

        <div className="hero-inner relative z-10 flex min-h-[inherit] flex-col pointer-events-none">
          <div className="hero-copy-shield pointer-events-none absolute inset-0 z-0" aria-hidden />

          <div className="hero-nav-slot relative z-10 flex shrink-0 items-center pointer-events-auto">
            <HeroNavBar variant="hero" />
          </div>

          <div className="hero-copy flex flex-1 flex-col items-center justify-start text-center max-md:pt-[min(2.5vh,1.25rem)] pointer-events-auto">
            <div className="hero-copy-column">
              <h1
                className="hero-animate-title font-display font-normal text-balance text-[#FFF9F5] max-w-[min(94vw,680px)] text-[clamp(1.85rem,7.2vw,2.35rem)] leading-[1.1] tracking-[0.015em] sm:text-[2.85rem] md:text-[3.35rem] lg:text-[4.1rem] xl:text-[4.65rem] xl:leading-[1.06] xl:max-w-[720px]"
              >
                {t('hero.titleLine1')}
                <br />
                {t('hero.titleLine2')}
              </h1>

              <p
                className="hero-animate-subtitle mt-3 sm:mt-5 lg:mt-6 max-w-[min(90vw,26rem)] px-1 text-[12.5px] sm:text-[14px] leading-[1.6] sm:leading-[1.65] text-[#FFF9F5]/76 md:text-[#1C1714] font-sans font-normal text-pretty"
              >
                {t('hero.subtitle')}
              </p>

              <Link
                href="/products"
                className="hero-animate-cta hero-cta-btn hero-cta mt-4 sm:mt-6 lg:mt-7"
              >
                <span className="hero-cta-label">{t('hero.shopCollection')}</span>
              </Link>
            </div>
          </div>
        </div>

        <a
          href="#discover"
          aria-label={t('hero.scrollHint')}
          className="hero-animate-scroll hero-scroll-hint absolute z-40 font-sans uppercase focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFF9F5]/45"
        >
          <span className="hero-scroll-text">{t('hero.scrollHint')}</span>
          <span className="hero-scroll-line" aria-hidden />
          <span className="hero-scroll-arrow" aria-hidden>↓</span>
        </a>

        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t('hero.whatsapp')}
          className="hero-animate-whatsapp hero-whatsapp-btn absolute z-20 flex items-center justify-center rounded-full"
        >
          <WhatsAppIcon className="hero-whatsapp-icon" />
        </a>
      </section>

      <HeroMarqueeBar />
    </>
  );
}
