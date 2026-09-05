'use client';

import { ShoppingBag, Truck, ShieldCheck, Sparkles } from 'lucide-react';
import { useLocale } from '@/i18n/store';

const FEATURE_KEYS = [
  { icon: ShoppingBag, step: '01', titleKey: 'shopFeatures.f1title', descKey: 'shopFeatures.f1desc' },
  { icon: Truck, step: '02', titleKey: 'shopFeatures.f2title', descKey: 'shopFeatures.f2desc' },
  { icon: ShieldCheck, step: '03', titleKey: 'shopFeatures.f3title', descKey: 'shopFeatures.f3desc' },
  { icon: Sparkles, step: '04', titleKey: 'shopFeatures.f4title', descKey: 'shopFeatures.f4desc' },
] as const;

export function ShopFeaturesBar() {
  const { t } = useLocale();

  return (
    <section className="w-full border-t border-[#E8D4D5]/80 bg-[#FFF9F5] py-12 sm:py-16">
      <div className="w-full px-4 sm:px-8 lg:px-10 xl:px-14">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURE_KEYS.map(({ icon: Icon, step, titleKey, descKey }) => (
            <article key={step} className="relative pl-4 sm:pl-0">
              <span
                className="pointer-events-none absolute -top-4 right-0 font-serif text-6xl sm:text-7xl text-[#E8D4D5]/60 select-none"
                aria-hidden
              >
                {step}
              </span>
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-[#F8F2ED] text-[#A96868] mb-4">
                <Icon size={20} strokeWidth={1.35} />
              </div>
              <h3 className="font-serif text-lg text-[#1C1714] tracking-tight mb-2">{t(titleKey)}</h3>
              <p className="text-sm leading-relaxed text-[#6B625A] font-sans max-w-xs">{t(descKey)}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
