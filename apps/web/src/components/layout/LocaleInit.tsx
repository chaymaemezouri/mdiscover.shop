'use client';

import { useEffect } from 'react';
import { useLocale } from '@/i18n/store';
import type { Locale } from '@/i18n/translations';
import { locales } from '@/i18n/translations';

const LOCALE_COOKIE = 'mdiscover-locale';

function readCookieLocale(): Locale | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
  const value = match?.[1];
  return value && locales.includes(value as Locale) ? (value as Locale) : null;
}

export function LocaleInit() {
  const locale = useLocale((s) => s.locale);
  const setLocale = useLocale((s) => s.setLocale);

  useEffect(() => {
    const fromCookie = readCookieLocale();
    if (fromCookie && fromCookie !== locale) {
      setLocale(fromCookie);
      return;
    }
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [locale, setLocale]);

  return null;
}
