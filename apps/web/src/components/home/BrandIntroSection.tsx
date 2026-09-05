'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useLocale } from '@/i18n/store';

const POINT_KEYS = ['p1', 'p2', 'p3'] as const;
const BRAND_IMAGE = '/categories/brand-story-elixir.jpeg';

export function BrandIntroSection() {
  const { t } = useLocale();
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`brand-story ${visible ? 'brand-story--visible' : ''}`}
      aria-labelledby="brand-story-title"
    >
      <div className="brand-story-aura" aria-hidden>
        <span className="brand-story-orb brand-story-orb--a" />
        <span className="brand-story-orb brand-story-orb--b" />
        <span className="brand-story-orb brand-story-orb--c" />
        <span className="brand-story-sheen" />
      </div>

      <div className="brand-story-panel">
        <div className="brand-story-main">
          <div className="brand-story-copy brand-story-reveal" style={{ ['--reveal-delay' as string]: '0ms' }}>
            <p className="brand-story-eyebrow">{t('brand.eyebrow')}</p>
            <h2 id="brand-story-title" className="brand-story-title">
              {t('brand.title')}
            </h2>
            <p className="brand-story-lead">{t('brand.description')}</p>
          </div>

          <ul className="brand-story-points">
            {POINT_KEYS.map((key, index) => (
              <li
                key={key}
                className="brand-story-point brand-story-reveal"
                style={{ ['--reveal-delay' as string]: `${140 + index * 100}ms` }}
              >
                <span className="brand-story-point-index" aria-hidden>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="brand-story-point-title">{t(`brand.${key}title`)}</h3>
                  <p className="brand-story-point-desc">{t(`brand.${key}desc`)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div
          className="brand-story-media brand-story-reveal"
          style={{ ['--reveal-delay' as string]: '100ms' }}
        >
          <Image
            src={BRAND_IMAGE}
            alt="mDISCOVER Hydration Elixir"
            fill
            sizes="(max-width: 960px) 100vw, 55vw"
            className="brand-story-photo"
          />
          <div className="brand-story-media-scrim" aria-hidden />

          <div className="brand-story-media-content">
            <p className="brand-story-media-eyebrow">{t('brand.eyebrow')}</p>
            <p className="brand-story-media-text">{t('brand.mediaLine')}</p>
            <Link href="/products" className="brand-story-glass-cta">
              <span>{t('brand.explore')}</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
