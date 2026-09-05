'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, MapPin, Phone } from 'lucide-react';
import { useLocale } from '@/i18n/store';
import { apiFetch } from '@/lib/api';
import { STORE_PHONE_DISPLAY, STORE_PHONE_TEL, storeWhatsAppUrl } from '@/lib/contact';

const WHATSAPP_URL = storeWhatsAppUrl('Bonjour, je souhaite contacter mDISCOVER.');
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.511-5.16c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const fieldClass =
  'w-full border-0 border-b border-[#E8D4D5] bg-transparent px-0 py-3.5 text-[15px] text-charcoal-900 font-sans placeholder:text-[#A89888] focus:outline-none focus:border-[#A96868] transition-colors duration-300';

export function ContactPageContent() {
  const { t } = useLocale();
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setStatus('sending');
    try {
      await apiFetch('/contact', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          message: form.message.trim(),
        }),
      });
      setStatus('success');
      setForm({ name: '', email: '', phone: '', message: '' });
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Erreur');
    }
  }

  return (
    <div className="relative bg-[#FBF8F4] min-h-[calc(100svh-12rem)] overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 45% at 15% 0%, rgba(169,104,104,0.13), transparent 55%), radial-gradient(ellipse 50% 40% at 90% 10%, rgba(232,212,213,0.5), transparent 50%), linear-gradient(180deg, #FBF8F4 0%, #F8F2ED 100%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(169,104,104,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(169,104,104,0.04) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'linear-gradient(180deg, black, transparent 85%)',
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20 lg:py-24">
        <div className="max-w-2xl mx-auto text-center mb-12 sm:mb-16">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#B77D7E] font-sans font-medium mb-3 animate-[fadeUp_0.6s_ease_both]">
            {t('contactModal.eyebrow')}
          </p>
          <h1 className="font-display text-[clamp(2.1rem,5vw,3.25rem)] font-normal text-charcoal-900 tracking-tight leading-[1.1] animate-[fadeUp_0.7s_ease_both]">
            {t('contactModal.title')}
          </h1>
          <p className="mt-4 text-sm sm:text-[15px] leading-relaxed text-charcoal-600 font-sans max-w-lg mx-auto animate-[fadeUp_0.8s_ease_both]">
            {t('contactModal.subtitle')}
          </p>
          <div className="mx-auto mt-8 h-px w-16 bg-gradient-to-r from-transparent via-[#A96868]/70 to-transparent" />
        </div>

        <div className="grid lg:grid-cols-[0.95fr_1.15fr] gap-10 lg:gap-14 items-start">
          <aside className="space-y-6 lg:pt-2 order-2 lg:order-1">
            <div className="rounded-[22px] border border-[#E8D4D5]/90 bg-[#FFF9F5]/80 backdrop-blur-sm px-6 sm:px-7 py-7 shadow-[0_20px_50px_rgba(169,104,104,0.08)]">
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#B77D7E] font-sans mb-5">
                mDISCOVER
              </p>
              <ul className="space-y-5">
                <li className="flex gap-3.5">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E8D4D5] bg-white text-[#A96868]">
                    <Mail size={15} strokeWidth={1.5} />
                  </span>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-[#9B6264]/80 font-sans">Email</p>
                    <a
                      href="mailto:contact@mdiscover.ma"
                      className="mt-0.5 block text-sm text-charcoal-900 hover:text-[#A96868] transition-colors font-sans"
                    >
                      contact@mdiscover.ma
                    </a>
                  </div>
                </li>
                <li className="flex gap-3.5">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E8D4D5] bg-white text-[#A96868]">
                    <Phone size={15} strokeWidth={1.5} />
                  </span>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-[#9B6264]/80 font-sans">Téléphone</p>
                    <a
                      href={STORE_PHONE_TEL}
                      className="mt-0.5 block text-sm text-charcoal-900 hover:text-[#A96868] transition-colors font-sans"
                    >
                      {STORE_PHONE_DISPLAY}
                    </a>
                  </div>
                </li>
                <li className="flex gap-3.5">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E8D4D5] bg-white text-[#A96868]">
                    <MapPin size={15} strokeWidth={1.5} />
                  </span>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-[#9B6264]/80 font-sans">Adresse</p>
                    <p className="mt-0.5 text-sm text-charcoal-900 font-sans">Maroc</p>
                  </div>
                </li>
              </ul>

              <div className="mt-7 pt-6 border-t border-[#E8D4D5]/80 flex flex-wrap gap-4">
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-[#A96868] hover:text-[#9B6264] transition-colors font-sans"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  {t('contactModal.whatsapp')}
                </a>
                <Link
                  href="/pages/faq"
                  className="text-sm text-charcoal-500 hover:text-[#A96868] transition-colors font-sans"
                >
                  FAQ →
                </Link>
              </div>
            </div>

            <p className="px-1 text-[12px] leading-relaxed text-[#9B6264] font-sans">
              Réponse sous 24–48 h · Soins, commandes & conseils beauté
            </p>
          </aside>

          <div className="order-1 lg:order-2 rounded-[22px] border border-[#E8D4D5] bg-[#FFF9F5] px-6 sm:px-9 py-8 sm:py-10 shadow-[0_28px_70px_rgba(169,104,104,0.1)]">
            {status === 'success' ? (
              <div className="py-10 text-center animate-[fadeUp_0.5s_ease_both]">
                <div className="mx-auto mb-5 h-px w-12 bg-[#A96868]/50" />
                <p className="font-display text-2xl text-charcoal-900">{t('contactModal.success')}</p>
                <button
                  type="button"
                  onClick={() => setStatus('idle')}
                  className="mt-8 text-sm text-[#A96868] hover:text-[#9B6264] font-sans transition-colors"
                >
                  ← {t('contactModal.send')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-1">
                <div className="grid sm:grid-cols-2 gap-x-8">
                  <label className="block py-1">
                    <span className="sr-only">{t('contactModal.name')}</span>
                    <input
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder={t('contactModal.name')}
                      className={fieldClass}
                      autoComplete="name"
                    />
                  </label>
                  <label className="block py-1">
                    <span className="sr-only">{t('contactModal.email')}</span>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder={t('contactModal.email')}
                      className={fieldClass}
                      autoComplete="email"
                    />
                  </label>
                </div>
                <label className="block py-1">
                  <span className="sr-only">{t('contactModal.phone')}</span>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder={t('contactModal.phone')}
                    className={fieldClass}
                    autoComplete="tel"
                  />
                </label>
                <label className="block py-1">
                  <span className="sr-only">{t('contactModal.message')}</span>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder={t('contactModal.message')}
                    className={`${fieldClass} resize-none min-h-[140px]`}
                  />
                </label>

                {status === 'error' && error && (
                  <p className="pt-3 text-sm text-red-600 font-sans">{error}</p>
                )}

                <div className="pt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <p className="text-[11px] text-[#9B6264]/90 font-sans tracking-wide">
                    Vos informations restent confidentielles.
                  </p>
                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-[#A96868] px-9 py-3.5 text-[11px] uppercase tracking-[0.18em] font-semibold text-[#FFF9F5] font-sans hover:bg-[#9B6264] transition-colors disabled:opacity-60 shadow-[0_8px_28px_rgba(169,104,104,0.32)]"
                  >
                    <span className="relative z-10">
                      {status === 'sending' ? '…' : t('contactModal.send')}
                    </span>
                    <span className="pointer-events-none absolute inset-0 translate-y-full bg-white/10 transition-transform duration-500 group-hover:translate-y-0" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
