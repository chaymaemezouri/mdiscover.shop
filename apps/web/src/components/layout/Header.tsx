'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { HeroNavBar } from '@/components/layout/HeroNavBar';

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const [pastHero, setPastHero] = useState(false);
  const pastHeroRef = useRef(false);

  useEffect(() => {
    if (!isHome) {
      pastHeroRef.current = false;
      setPastHero(false);
      return;
    }

    const marquee = document.querySelector('.hero-marquee-bar');
    if (!marquee) return;

    let raf = 0;

    const update = () => {
      raf = 0;
      // Sticky nav only after the marquee band has fully scrolled off screen
      const next = marquee.getBoundingClientRect().bottom <= 0;
      if (next === pastHeroRef.current) return;
      pastHeroRef.current = next;
      setPastHero(next);
    };

    const scheduleUpdate = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });

    return () => {
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isHome]);

  if (isHome && !pastHero) return null;

  const nav = (
    <div className="w-full max-w-[100vw] pl-3.5 pr-2 sm:px-6 md:px-8 py-2.5 sm:py-2.5 md:py-3">
      <HeroNavBar variant="page" />
    </div>
  );

  if (isHome) {
    return (
      <header className="fixed inset-x-0 top-0 z-50 bg-[#FBF8F4]/97 backdrop-blur-sm border-b border-[#E8DFD6]/90">
        {nav}
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 bg-[#FBF8F4]/97 backdrop-blur-sm border-b border-[#E8DFD6]/90">
      {nav}
    </header>
  );
}
