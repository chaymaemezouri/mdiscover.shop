'use client';

import { useLocale } from '@/i18n/store';

const MARQUEE_ITEMS = [
  { titleKey: 'hero.marqueeShipping', descKey: 'hero.marqueeShippingDesc' },
  { titleKey: 'hero.marqueeCod', descKey: 'hero.marqueeCodDesc' },
  { titleKey: 'hero.marqueeGift', descKey: 'hero.marqueeGiftDesc' },
  { titleKey: 'hero.marqueeAuthentic', descKey: 'hero.marqueeAuthenticDesc' },
  { titleKey: 'hero.marqueeRitual', descKey: 'hero.marqueeRitualDesc' },
] as const;

function MarqueePhrases() {
  const { t } = useLocale();

  return (
    <>
      {MARQUEE_ITEMS.map(({ titleKey, descKey }) => (
        <span key={titleKey} className="hero-marquee-phrase inline-flex shrink-0 items-center whitespace-nowrap">
          <span className="hero-marquee-title">{t(titleKey)}</span>
          <span className="hero-marquee-dash" aria-hidden>
            {' '}
            —{' '}
          </span>
          <span className="hero-marquee-desc">{t(descKey)}</span>
          <span className="hero-marquee-sep" aria-hidden>
            ·
          </span>
        </span>
      ))}
    </>
  );
}

export function HeroMarqueeBar() {
  const { t } = useLocale();

  return (
    <div
      id="discover"
      className="hero-marquee-bar scroll-mt-0"
      aria-label={t('hero.marqueeAria')}
    >
      <div className="hero-marquee-bar-track flex w-max items-center">
        <MarqueePhrases />
        <MarqueePhrases />
      </div>
    </div>
  );
}
