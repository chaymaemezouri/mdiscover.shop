'use client';

import { useEffect, useState } from 'react';
import { useLocale } from '@/i18n/store';

const CONSENT_KEY = 'mdiscover-cookie-consent';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const { t } = useLocale();

  useEffect(() => {
    if (!localStorage.getItem(CONSENT_KEY)) {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setVisible(false);
    window.dispatchEvent(new Event('cookie-consent-accepted'));
  }

  function decline() {
    localStorage.setItem(CONSENT_KEY, 'declined');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-charcoal-900 text-cream-100 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:p-6 shadow-2xl">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center gap-4">
        <p className="text-sm leading-relaxed flex-1">
          {t('cookie.text')}{' '}
          <a href="/pages/confidentialite" className="text-pink-400 hover:underline">
            {t('cookie.privacy')}
          </a>.
        </p>
        <div className="flex flex-col min-[380px]:flex-row gap-2 sm:gap-3 shrink-0 w-full md:w-auto">
          <button onClick={decline} className="flex-1 md:flex-none min-h-[44px] px-4 py-2 text-sm border border-cream-400/30 hover:bg-charcoal-800 transition-colors">
            {t('cookie.decline')}
          </button>
          <button onClick={accept} className="flex-1 md:flex-none min-h-[44px] px-4 py-2 text-sm bg-pink-500 text-charcoal-900 font-medium hover:bg-pink-400 transition-colors">
            {t('cookie.accept')}
          </button>
        </div>
      </div>
    </div>
  );
}
