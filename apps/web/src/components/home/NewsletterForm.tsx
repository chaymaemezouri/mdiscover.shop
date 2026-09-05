'use client';

import { useState } from 'react';
import { API_URL } from '@/lib/api';
import { useLocale } from '@/i18n/store';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const { t } = useLocale();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch(`${API_URL}/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
    }
  }

  return (
    <section className="bg-white w-full px-3 sm:px-6 md:px-8 py-10 sm:py-14 lg:py-20">
      <div className="newsletter-cta-card rounded-[20px] sm:rounded-[28px] px-4 py-8 sm:px-10 sm:py-12 lg:px-14 lg:py-14 xl:px-16">
          <div className="grid gap-8 sm:gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12 xl:gap-16 items-end">
            <div>
              <h2 className="font-display text-[clamp(1.65rem,6vw,3rem)] font-normal text-[#FFF9F5] leading-[1.08] tracking-tight max-w-xl">
                {t('newsletter.titleLine1')}
                <br />
                {t('newsletter.titleLine2')}
              </h2>

              <form onSubmit={handleSubmit} className="newsletter-form mt-8 sm:mt-10 max-w-xl">
                <label htmlFor="newsletter-email" className="sr-only">
                  {t('newsletter.placeholder')}
                </label>
                <div className="newsletter-form-bar">
                  <input
                    id="newsletter-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('newsletter.placeholder')}
                    className="newsletter-email-input"
                  />
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="newsletter-send-btn"
                  >
                    {status === 'loading' ? t('newsletter.sending') : `${t('newsletter.submit')} ›`}
                  </button>
                </div>
              </form>

              {status === 'success' && (
                <p className="mt-4 text-sm text-[#E8D4D5] font-sans">{t('newsletter.success')}</p>
              )}
              {status === 'error' && (
                <p className="mt-4 text-sm text-[#DDB0A8] font-sans">{t('newsletter.error')}</p>
              )}
            </div>

            <div className="lg:max-w-sm lg:ml-auto lg:pb-1">
              <h3 className="text-base sm:text-lg font-semibold text-[#FFF9F5] font-sans tracking-tight">
                {t('newsletter.sideTitle')}
              </h3>
              <p className="mt-3 text-sm sm:text-[15px] leading-[1.7] text-[#FFF9F5]/85 font-sans">
                {t('newsletter.sideDesc')}
              </p>
            </div>
          </div>
        </div>
    </section>
  );
}
