'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Product } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { useLocale } from '@/i18n/store';

type HeroSlot = 'serum' | 'cream' | 'lotion' | 'concentrate';

/**
 * Marker + anchor positions (% of hero stage) tuned to the hero photograph.
 * Markers sit beside each product; anchors target the product body.
 */
const HERO_SLOTS: Array<{
  slot: HeroSlot;
  markerX: number;
  markerY: number;
  anchorX: number;
  anchorY: number;
}> = [
  { slot: 'serum', markerX: 18, markerY: 64, anchorX: 16, anchorY: 72 },
  { slot: 'cream', markerX: 36, markerY: 62, anchorX: 34, anchorY: 73 },
  { slot: 'lotion', markerX: 54, markerY: 65, anchorX: 52, anchorY: 73 },
  { slot: 'concentrate', markerX: 72, markerY: 64, anchorX: 70, anchorY: 72 },
];

function findProductForSlot(slot: HeroSlot, products: Product[], used: Set<string>): Product | null {
  const slugMatch = (p: Product, terms: string[]) => {
    const slug = p.slug.toLowerCase();
    const name = p.name.toLowerCase();
    return terms.some((t) => slug.includes(t) || name.includes(t));
  };

  const catMatch = (p: Product, slugs: string[]) =>
    slugs.includes(p.category?.slug?.toLowerCase() ?? '');

  const pick = (list: Product[]) => list.find((p) => !used.has(p.id)) ?? null;

  if (slot === 'serum') {
    return pick(
      products.filter(
        (p) =>
          slugMatch(p, ['serum', 'sérum']) &&
          !slugMatch(p, ['concentrate', 'concentré', 'concentre']),
      ),
    ) ?? pick(products.filter((p) => catMatch(p, ['serums']) && !slugMatch(p, ['concentrate', 'concentré'])));
  }

  if (slot === 'cream') {
    return pick(
      products.filter(
        (p) => slugMatch(p, ['cream', 'crème', 'creme']) || catMatch(p, ['face-cream']),
      ),
    );
  }

  if (slot === 'lotion') {
    return pick(
      products.filter(
        (p) =>
          slugMatch(p, ['lotion']) ||
          catMatch(p, ['body-lotion', 'lotions', 'face-lotion', 'hair-care']),
      ),
    );
  }

  return pick(
    products.filter(
      (p) => slugMatch(p, ['concentrate', 'concentré', 'concentre', 'ampoule']),
    ),
  ) ?? pick(products.filter((p) => catMatch(p, ['serums']) && slugMatch(p, ['concentrate', 'concentré'])));
}

interface Props {
  products: Product[];
}

export function HeroProductHotspots({ products }: Props) {
  const { t } = useLocale();
  const [activeSlot, setActiveSlot] = useState<HeroSlot | null>(null);
  const layerRef = useRef<HTMLDivElement>(null);

  const used = new Set<string>();
  const items = HERO_SLOTS.map((layout) => {
    const product = findProductForSlot(layout.slot, products, used);
    if (!product) return null;
    used.add(product.id);
    return { ...layout, product };
  }).filter(Boolean) as Array<{
    slot: HeroSlot;
    markerX: number;
    markerY: number;
    anchorX: number;
    anchorY: number;
    product: Product;
  }>;

  const close = useCallback(() => setActiveSlot(null), []);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!layerRef.current?.contains(e.target as Node)) {
        setActiveSlot(null);
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  if (items.length === 0) return null;

  return (
    <div ref={layerRef} className="hero-hotspots absolute inset-0 z-[5]" aria-label="Featured products">
      <svg
        className="hero-hotspot-lines absolute inset-0 h-full w-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        {items.map(({ slot, markerX, markerY, anchorX, anchorY, product }) => {
          const isActive = activeSlot === slot;
          return (
            <line
              key={product.id}
              x1={markerX}
              y1={markerY}
              x2={anchorX}
              y2={anchorY}
              className={`hero-hotspot-line ${isActive ? 'hero-hotspot-line--active' : ''}`}
            />
          );
        })}
      </svg>

      {items.map(({ slot, markerX, markerY, product }) => {
        const isOpen = activeSlot === slot;
        const description = product.shortDescription ?? t('hero.hotspot.fallbackDesc');

        return (
          <div
            key={product.id}
            className="hero-hotspot absolute"
            data-slot={slot}
            style={{ left: `${markerX}%`, top: `${markerY}%` }}
            onPointerLeave={() => setActiveSlot((s) => (s === slot ? null : s))}
          >
            <button
              type="button"
              aria-label={product.name}
              aria-expanded={isOpen}
              className={`hero-hotspot-trigger ${isOpen ? 'hero-hotspot-trigger--active' : ''}`}
              onPointerEnter={() => setActiveSlot(slot)}
              onFocus={() => setActiveSlot(slot)}
              onClick={() => setActiveSlot(isOpen ? null : slot)}
            >
              <span className="hero-hotspot-plus" aria-hidden>+</span>
            </button>

            <div
              className={`hero-hotspot-card hero-hotspot-card--above ${isOpen ? 'hero-hotspot-card--visible' : ''}`}
              role="dialog"
              aria-hidden={!isOpen}
            >
              <p className="hero-hotspot-name">{product.name}</p>
              <p className="hero-hotspot-desc">{description}</p>
              <p className="hero-hotspot-price">{formatPrice(product.price)}</p>
              <Link
                href={`/products/${product.slug}`}
                className="hero-hotspot-link"
                onClick={close}
              >
                {t('hero.hotspot.viewProduct')}
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
