'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PRODUCT_CATEGORIES } from '@mdiscovershop/shared';
import type { Category } from '@/lib/api';
import { useLocale } from '@/i18n/store';

type CategoryPresentation = {
  tag: string;
  description: string;
  image: string;
  imagePosition?: string;
  tint: string;
};

const CATEGORY_PRESENTATION: Record<string, CategoryPresentation> = {
  serums: {
    tag: 'Concentrated care',
    description: 'Potent formulas for radiance, firmness and deep skin renewal.',
    image: '/categories/serums.jpeg',
    imagePosition: '50% 42%',
    tint: '#C48782',
  },
  'face-cream': {
    tag: 'Daily hydration',
    description: 'Silky creams that nourish and restore your natural barrier.',
    image: '/categories/face-cream.jpeg',
    imagePosition: '42% 48%',
    tint: '#D4A8A4',
  },
  'eye-cream': {
    tag: 'Delicate zone',
    description: 'Brightening care for the fragile eye contour area.',
    image: '/categories/eye-cream.jpeg',
    imagePosition: '50% 45%',
    tint: '#B77D7E',
  },
  cleanser: {
    tag: 'First ritual',
    description: 'Gentle cleansers that purify without stripping moisture.',
    image: '/categories/cleanser.jpeg',
    imagePosition: '50% 48%',
    tint: '#C48782',
  },
  'hair-care': {
    tag: 'Hair ritual',
    description: 'Luxury formulas for stronger, shinier and healthier hair.',
    image: '/categories/hair-care.jpeg',
    imagePosition: '50% 45%',
    tint: '#A96868',
  },
  shampoo: {
    tag: 'Cleanse & refresh',
    description: 'Soft shampoos that respect the scalp and daily balance.',
    image: '/categories/shampoo.jpeg',
    imagePosition: '48% 46%',
    tint: '#D99F96',
  },
  conditioner: {
    tag: 'Silk & softness',
    description: 'Conditioning treatments for smooth, manageable hair.',
    image: '/categories/conditioner.jpeg',
    imagePosition: '50% 48%',
    tint: '#D4A8A4',
  },
  toner: {
    tag: 'Balance & prep',
    description: 'Refining toners that restore pH before your treatment.',
    image: '/categories/toner.jpeg',
    imagePosition: '50% 45%',
    tint: '#C48782',
  },
  'sun-block': {
    tag: 'Daily protection',
    description: 'Lightweight SPF shields with a comfortable, sheer finish.',
    image: '/categories/sun-block.jpeg',
    imagePosition: '50% 48%',
    tint: '#E8D4D5',
  },
  pdrn: {
    tag: 'Advanced repair',
    description: 'Regenerative PDRN care for elasticity and visible renewal.',
    image: '/categories/pdrn.jpeg',
    imagePosition: '50% 42%',
    tint: '#A96868',
  },
  'product-sets': {
    tag: 'Curated rituals',
    description: 'Complete routines thoughtfully paired for visible results.',
    image: '/categories/product-sets.jpeg',
    imagePosition: '50% 48%',
    tint: '#D99F96',
  },
  parfums: {
    tag: 'Signature scent',
    description: 'Elegant fragrances that complete your beauty ritual.',
    image: '/categories/parfums.jpeg',
    imagePosition: '50% 45%',
    tint: '#D4A8A4',
  },
};

const TINT_CYCLE = ['#C48782', '#D4A8A4', '#B77D7E', '#A96868', '#D99F96', '#E8D4D5'];

const DEFAULT_PRESENTATION: CategoryPresentation = {
  tag: 'Skincare',
  description: 'Discover luxury formulas crafted for visible radiance.',
  image: '/categories/product-sets.jpeg',
  tint: '#C48782',
};

export type CarouselCategory = {
  slug: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
};

function toCarouselItems(categories: Category[]): CarouselCategory[] {
  return categories.map((c) => ({
    slug: c.slug,
    name: c.nameEn || c.nameFr,
    description: c.description,
    imageUrl: c.imageUrl,
  }));
}

function fallbackCarouselItems(): CarouselCategory[] {
  return PRODUCT_CATEGORIES.filter((c) => !c.parentSlug).map((c) => ({
    slug: c.slug,
    name: c.nameEn || c.nameFr,
  }));
}

/** Prefer relative paths so Next.js can resize/compress images. */
function toCarouselImageSrc(raw: string): string {
  const src = raw.trim();
  if (!src) return src;
  if (src.startsWith('/')) return src;
  try {
    const u = new URL(src);
    if (
      u.pathname.startsWith('/categories/') &&
      (u.hostname === 'mdiscover.shop' ||
        u.hostname === 'www.mdiscover.shop' ||
        u.hostname === 'localhost' ||
        u.hostname.endsWith('.local'))
    ) {
      return u.pathname;
    }
  } catch {
    /* keep raw */
  }
  return src;
}

function resolvePresentation(item: CarouselCategory, index: number): CategoryPresentation {
  const preset = CATEGORY_PRESENTATION[item.slug];
  const base = preset ?? DEFAULT_PRESENTATION;
  // Prefer local preset file when available (fast + optimizable by Next)
  const fromApi = item.imageUrl?.trim();
  const chosen = preset?.image || (fromApi ? toCarouselImageSrc(fromApi) : base.image);
  return {
    tag: preset?.tag ?? 'Collection',
    description: item.description?.trim() || base.description,
    image: chosen,
    imagePosition: preset?.imagePosition ?? '50% 50%',
    tint: preset?.tint ?? TINT_CYCLE[index % TINT_CYCLE.length],
  };
}

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const AUTO_PLAY_MS = 2800;

function getWrappedOffset(index: number, activeIndex: number, total: number) {
  if (total <= 0) return 0;
  let offset = index - activeIndex;
  if (offset > total / 2) offset -= total;
  if (offset < -total / 2) offset += total;
  return offset;
}

type ArcLayout = {
  baseWidth: number;
  gap: number;
  overlap: number;
  maxVisible: number;
  minScale: number;
  maxScale: number;
  radius: number;
  anglePerStep: number;
};

function getArcScale(absOffset: number, layout: ArcLayout) {
  const { minScale, maxScale, maxVisible } = layout;
  if (absOffset === 0) return maxScale;

  const t = absOffset / maxVisible;
  return maxScale - (maxScale - minScale) * Math.min(t, 1);
}

function getArcStep(layout: ArcLayout, prevScale: number, curScale: number) {
  const pull = 1 - layout.overlap;
  return layout.baseWidth * (prevScale / 2) * pull + layout.gap + layout.baseWidth * (curScale / 2) * pull;
}

function getArcX(offset: number, layout: ArcLayout) {
  if (offset === 0) return 0;

  const sign = offset > 0 ? 1 : -1;
  let x = 0;

  for (let i = 1; i <= Math.abs(offset); i++) {
    x += sign * getArcStep(layout, getArcScale(i - 1, layout), getArcScale(i, layout));
  }

  return x;
}

function solveBaseWidth(
  viewportWidth: number,
  maxVisible: number,
  gap: number,
  overlap: number,
  minScale: number,
  maxScale: number,
) {
  const isMobile = viewportWidth < 640;
  const edgeInset = isMobile ? Math.max(8, viewportWidth * 0.015) : 4;
  const targetHalf = (viewportWidth / 2 - edgeInset) * (isMobile ? 0.99 : 0.98);
  let baseWidth = isMobile ? Math.min(360, viewportWidth * 0.88) : viewportWidth < 1024 ? 210 : 242;

  for (let i = 0; i < 24; i++) {
    const probe: ArcLayout = {
      baseWidth,
      gap,
      overlap,
      maxVisible,
      minScale,
      maxScale,
      radius: 1,
      anglePerStep: 1,
    };
    const outerEdge = (baseWidth * maxScale) / 2;
    const span = Math.abs(getArcX(maxVisible, probe)) + outerEdge;
    baseWidth *= targetHalf / span;
  }

  if (isMobile) {
    return Math.min(Math.max(baseWidth, viewportWidth * 0.84), viewportWidth * 0.92);
  }

  return baseWidth;
}

function getArcVisualTier(absOffset: number) {
  if (absOffset === 0) {
    return { opacity: 1, blur: 0, brightness: 1.08, saturate: 1.07 };
  }
  if (absOffset === 1) {
    return { opacity: 0.9, blur: 0.18, brightness: 0.96, saturate: 0.95 };
  }
  if (absOffset === 2) {
    return { opacity: 0.62, blur: 0.48, brightness: 0.88, saturate: 0.9 };
  }
  if (absOffset === 3) {
    return { opacity: 0.42, blur: 0.72, brightness: 0.82, saturate: 0.86 };
  }
  return { opacity: 0.3, blur: 0.95, brightness: 0.78, saturate: 0.82 };
}

function getArcTransform(offset: number, layout: ArcLayout) {
  const { maxVisible, anglePerStep, radius } = layout;

  if (Math.abs(offset) > maxVisible) {
    return {
      transform: 'translate(-50%, -50%) translateZ(-420px) scale(0.38)',
      opacity: 0,
      zIndex: 0,
      filter: 'blur(1.4px) brightness(0.72) saturate(0.76)',
      tier: maxVisible + 1,
      pointerEvents: 'none' as const,
    };
  }

  const absOffset = Math.abs(offset);
  const scale = getArcScale(absOffset, layout);
  const x = getArcX(offset, layout);
  const theta = offset * anglePerStep * (Math.PI / 180);
  const arcZ = -radius * Math.cos(theta);
  const z = arcZ + (maxVisible - absOffset) * 16;
  const rotateY = -offset * anglePerStep * 0.88;

  const visual = getArcVisualTier(absOffset);
  const filter = `blur(${visual.blur}px) brightness(${visual.brightness}) saturate(${visual.saturate})`;

  return {
    transform: `translate(-50%, -50%) translateX(${x}px) rotateY(${rotateY}deg) translateZ(${z}px) scale(${scale})`,
    opacity: visual.opacity,
    zIndex: 120 - absOffset * 22,
    filter,
    tier: absOffset,
    pointerEvents: 'none' as const,
  };
}

export function CategoryCarousel({ categories = [] }: { categories?: Category[] }) {
  const router = useRouter();
  const { t } = useLocale();
  const items = useMemo(() => {
    const fromApi = toCarouselItems(categories);
    // Prefer API — only fall back if the storefront could not load categories
    return fromApi.length > 0 ? fromApi : fallbackCarouselItems();
  }, [categories]);
  const total = items.length;

  const [activeIndex, setActiveIndex] = useState(0);
  const [layout, setLayout] = useState<ArcLayout>({
    baseWidth: 242,
    gap: -18,
    overlap: 0.42,
    maxVisible: 4,
    minScale: 0.52,
    maxScale: 1.08,
    radius: 900,
    anglePerStep: 10,
  });
  const touchStartX = useRef(0);
  const pointerStartX = useRef(0);
  const pointerMoved = useRef(false);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    setActiveIndex((prev) => (total === 0 ? 0 : Math.min(prev, total - 1)));
  }, [total]);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      const isMobile = w < 640;
      const isTablet = w < 1024;
      const gap = isMobile ? -28 : -18;
      const overlap = isMobile ? 0.52 : 0.42;
      const maxVisible = isMobile ? 1 : isTablet ? 3 : 4;
      const minScale = isMobile ? 0.58 : 0.52;
      const maxScale = isMobile ? 1.06 : 1.08;
      const baseWidth = solveBaseWidth(w, maxVisible, gap, overlap, minScale, maxScale);
      const anglePerStep = isMobile ? 3.5 : 10;
      const probe: ArcLayout = {
        baseWidth,
        gap,
        overlap,
        maxVisible,
        minScale,
        maxScale,
        radius: 1,
        anglePerStep,
      };
      const radius = Math.max(
        Math.abs(getArcX(maxVisible, probe)) * (isMobile ? 1.2 : 1.18),
        isMobile ? 220 : 420,
      );

      setLayout({
        baseWidth,
        gap,
        overlap,
        maxVisible,
        minScale,
        maxScale,
        radius,
        anglePerStep,
      });
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const goTo = useCallback(
    (index: number) => {
      if (total <= 0) return;
      setActiveIndex(((index % total) + total) % total);
    },
    [total],
  );

  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);
  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);

  const clearAutoPlay = useCallback(() => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = null;
    }
  }, []);

  const startAutoPlay = useCallback(() => {
    clearAutoPlay();
    if (pausedRef.current || total <= 1) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    autoPlayRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % total);
    }, AUTO_PLAY_MS);
  }, [clearAutoPlay, total]);

  useEffect(() => {
    startAutoPlay();
    return clearAutoPlay;
  }, [startAutoPlay, clearAutoPlay]);

  const pauseAutoPlay = useCallback(() => {
    pausedRef.current = true;
    clearAutoPlay();
  }, [clearAutoPlay]);

  const resumeAutoPlay = useCallback(() => {
    pausedRef.current = false;
    startAutoPlay();
  }, [startAutoPlay]);

  const handleManualNav = useCallback(
    (action: () => void) => {
      action();
      pauseAutoPlay();
      window.setTimeout(resumeAutoPlay, AUTO_PLAY_MS * 2);
    },
    [pauseAutoPlay, resumeAutoPlay],
  );

  const openCategory = useCallback(
    (slug: string) => {
      pauseAutoPlay();
      router.push(`/products?category=${encodeURIComponent(slug)}`);
    },
    [pauseAutoPlay, router],
  );

  const resolveCategoryIndexAtX = useCallback(
    (clientX: number, stageEl: HTMLElement) => {
      const rect = stageEl.getBoundingClientRect();
      const x = clientX - rect.left - rect.width / 2;
      let bestIndex = activeIndex;
      let bestDist = Number.POSITIVE_INFINITY;

      for (let i = 0; i < total; i++) {
        const offset = getWrappedOffset(i, activeIndex, total);
        if (Math.abs(offset) > layout.maxVisible) continue;
        const cardX = getArcX(offset, layout);
        const hitRadius = (layout.baseWidth * getArcScale(Math.abs(offset), layout)) / 2 + 24;
        const dist = Math.abs(cardX - x);
        if (dist < bestDist && dist <= hitRadius) {
          bestDist = dist;
          bestIndex = i;
        }
      }

      return bestDist === Number.POSITIVE_INFINITY ? null : bestIndex;
    },
    [activeIndex, layout, total],
  );

  if (total === 0) return null;

  const activeCategory = items[activeIndex];

  return (
    <section
      className="category-arc-section relative overflow-hidden"
      aria-label="Shop by category"
      onMouseEnter={pauseAutoPlay}
      onMouseLeave={resumeAutoPlay}
      onFocusCapture={pauseAutoPlay}
      onBlurCapture={resumeAutoPlay}
    >
      <div className="category-arc-glow pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative z-10 flex w-full items-end justify-between gap-3 px-3 pb-2 pt-10 sm:gap-4 sm:px-6 sm:pb-3 sm:pt-14 md:px-8 md:pt-16">
        <h2 className="section-title min-w-0 text-[clamp(1.35rem,4.5vw,2rem)]">
          {t('home.shopByCategory')}
        </h2>
        <Link
          href="/products"
          className="shrink-0 font-sans text-xs font-medium uppercase tracking-[0.14em] text-[#A96868] transition-colors hover:text-[#9B6264] sm:text-sm"
        >
          {t('home.viewAll')}
        </Link>
      </div>

      <div className="category-arc-viewport relative w-full">
        <button
          type="button"
          onClick={() => handleManualNav(goPrev)}
          aria-label="Previous category"
          className="category-arc-nav absolute left-1.5 top-1/2 z-50 -translate-y-1/2 sm:left-6"
        >
          <ChevronLeft className="h-5 w-5 sm:h-[18px] sm:w-[18px]" strokeWidth={1.35} />
        </button>

        <button
          type="button"
          onClick={() => handleManualNav(goNext)}
          aria-label="Next category"
          className="category-arc-nav absolute right-1.5 top-1/2 z-50 -translate-y-1/2 sm:right-6"
        >
          <ChevronRight className="h-5 w-5 sm:h-[18px] sm:w-[18px]" strokeWidth={1.35} />
        </button>

        <div
          className="category-arc-stage"
          style={{ '--arc-card-width': `${layout.baseWidth}px` } as CSSProperties}
          onPointerDown={(e) => {
            pointerStartX.current = e.clientX;
            pointerMoved.current = false;
          }}
          onPointerMove={(e) => {
            if (Math.abs(e.clientX - pointerStartX.current) > 12) {
              pointerMoved.current = true;
            }
          }}
          onClick={(e) => {
            if (pointerMoved.current) return;
            const target = e.target as HTMLElement;
            if (target.closest('.category-arc-nav')) return;
            const index = resolveCategoryIndexAtX(e.clientX, e.currentTarget);
            if (index == null) return;
            openCategory(items[index].slug);
          }}
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0].clientX;
            pointerMoved.current = false;
          }}
          onTouchMove={(e) => {
            if (Math.abs(e.touches[0].clientX - touchStartX.current) > 12) {
              pointerMoved.current = true;
            }
          }}
          onTouchEnd={(e) => {
            const diff = touchStartX.current - e.changedTouches[0].clientX;
            if (diff > 48) {
              handleManualNav(goNext);
              return;
            }
            if (diff < -48) {
              handleManualNav(goPrev);
              return;
            }
            if (pointerMoved.current) return;
            const index = resolveCategoryIndexAtX(e.changedTouches[0].clientX, e.currentTarget);
            if (index == null) return;
            openCategory(items[index].slug);
          }}
        >
          <div className="category-arc-track">
            {items.map((category, index) => {
              const offset = getWrappedOffset(index, activeIndex, total);
              const meta = resolvePresentation(category, index);
              const style = getArcTransform(offset, layout);
              const isActive = offset === 0;
              const tier = style.tier;
              const isRemote = /^https?:\/\//i.test(meta.image);

              return (
                <div
                  key={category.slug}
                  className={`category-arc-card category-arc-card--tier-${Math.min(tier, 3)}`}
                  style={{
                    transform: style.transform,
                    opacity: style.opacity,
                    zIndex: style.zIndex,
                    filter: style.filter,
                    pointerEvents: 'none',
                    transition: `transform 0.7s ${EASE}, opacity 0.7s ${EASE}, filter 0.7s ${EASE}`,
                  }}
                  aria-hidden={Math.abs(offset) > layout.maxVisible ? true : undefined}
                  data-category-slug={category.slug}
                  data-active={isActive ? 'true' : undefined}
                >
                  <article
                    className={`category-arc-card-inner category-arc-card-inner--tier-${Math.min(tier, 3)} ${isActive ? 'category-arc-card-inner--active' : ''}`}
                  >
                    <div className="category-arc-visual relative overflow-hidden rounded-[1.05rem]">
                      <Image
                        src={meta.image}
                        alt={category.name}
                        fill
                        sizes="(max-width: 640px) 78vw, 240px"
                        quality={72}
                        priority={isActive}
                        className={`category-arc-visual-img object-cover ${isActive ? 'category-arc-visual-img--active' : ''}`}
                        style={{ objectPosition: meta.imagePosition ?? '50% 50%' }}
                        draggable={false}
                        unoptimized={isRemote}
                      />
                      <div
                        className="category-arc-visual-tint pointer-events-none absolute inset-0"
                        style={{ backgroundColor: meta.tint }}
                        aria-hidden
                      />
                      <div className="category-arc-visual-shine pointer-events-none absolute inset-0" aria-hidden />
                      <div className="category-arc-editorial-scrim pointer-events-none absolute inset-x-0 bottom-0 top-auto h-[52%]" aria-hidden />

                      <div
                        className={`category-arc-card-copy category-arc-card-copy--tier-${Math.min(tier, 3)} absolute inset-x-0 bottom-0 z-10 flex flex-col justify-end px-3.5 pb-3.5 pt-2 sm:px-5 sm:pb-[1.125rem]`}
                      >
                        <p className="category-arc-card-tag font-sans font-medium uppercase tracking-[0.16em] text-[#FFF9F5]">
                          {meta.tag}
                        </p>
                        <h3 className="category-arc-card-title mt-1 font-display font-normal leading-[1.12] text-[#FFF9F5]/95 sm:mt-1.5">
                          {category.name}
                        </h3>
                        <p
                          className={`category-arc-card-desc mt-1 font-sans leading-[1.5] text-[#FFF9F5]/95 transition-all duration-500 sm:mt-1.5 sm:leading-[1.58] ${
                            isActive ? 'opacity-100 translate-y-0' : 'sr-only'
                          }`}
                        >
                          {meta.description}
                        </p>
                      </div>
                    </div>
                  </article>
                </div>
              );
            })}
          </div>
        </div>

        <div
          className="category-arc-progress-wrap relative z-20 flex w-full items-center gap-3 px-3 pb-10 sm:gap-5 sm:px-6 sm:pb-14 md:px-8"
          aria-label="Category pagination"
        >
          <p className="min-w-0 max-w-[42%] truncate font-sans text-[12px] font-medium tracking-[0.02em] text-[#3d3530]/70 sm:max-w-none sm:min-w-[5.5rem] sm:text-[13px]">
            {activeCategory.name}
          </p>
          <div className="category-arc-progress-track flex-1">
            <div
              className="category-arc-progress-thumb"
              style={{
                width: `${100 / total}%`,
                transform: `translateX(${activeIndex * 100}%)`,
              }}
            />
          </div>
          <p className="shrink-0 font-sans text-[11px] tabular-nums tracking-[0.08em] text-[#A96868]/80">
            {String(activeIndex + 1).padStart(2, '0')}
            <span className="mx-1 text-[#A96868]/35">/</span>
            {String(total).padStart(2, '0')}
          </p>
        </div>
      </div>
    </section>
  );
}
