import { cookies } from 'next/headers';
import type { Locale } from '@/i18n/translations';
import { locales } from '@/i18n/translations';

export async function getServerLocale(): Promise<Locale> {
  const value = cookies().get('mdiscover-locale')?.value;
  if (value && locales.includes(value as Locale)) return value as Locale;
  return 'en';
}
