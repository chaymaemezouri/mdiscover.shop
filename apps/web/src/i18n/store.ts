'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Locale } from './translations';
import { t as translate } from './translations';

interface LocaleStore {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (path: string, vars?: Record<string, string>) => string;
}

export const useLocale = create<LocaleStore>()(
  persist(
    (set, get) => ({
      locale: 'en',
      setLocale: (locale) => {
        document.documentElement.lang = locale;
        document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
        document.cookie = `mdiscover-locale=${locale};path=/;max-age=31536000;SameSite=Lax`;
        set({ locale });
      },
      t: (path, vars) => translate(get().locale, path, vars),
    }),
    {
      name: 'mdiscover-locale',
      onRehydrateStorage: () => (state) => {
        if (state) {
          document.documentElement.lang = state.locale;
          document.documentElement.dir = state.locale === 'ar' ? 'rtl' : 'ltr';
        }
      },
    },
  ),
);
