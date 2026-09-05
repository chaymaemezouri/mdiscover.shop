'use client';

import { Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/i18n/store';
import type { Locale } from '@/i18n/translations';
import { locales } from '@/i18n/translations';

const LOCALE_COOKIE = 'mdiscover-locale';

interface LocaleSwitcherProps {
  className?: string;
  iconSize?: number;
  strokeWidth?: number;
}

export function LocaleSwitcher({
  className = '',
  iconSize = 22,
  strokeWidth = 1.55,
}: LocaleSwitcherProps) {
  const { locale, setLocale } = useLocale();
  const router = useRouter();

  function cycle() {
    const idx = locales.indexOf(locale);
    const next = locales[(idx + 1) % locales.length] as Locale;
    document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=31536000;SameSite=Lax`;
    setLocale(next);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Language: ${locale.toUpperCase()}`}
      title={`Language: ${locale.toUpperCase()}`}
      className={className}
    >
      <Globe size={iconSize} strokeWidth={strokeWidth} />
    </button>
  );
}
