'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Shield,
  UserRound,
  Languages,
} from 'lucide-react';
import { AccountShell } from '@/components/account/AccountShell';
import { API_URL } from '@/lib/api';
import { clearAuthTokens, getAccessToken } from '@/lib/auth-client';
import { useAccountModal } from '@/store/accountModal';
import { useLocale } from '@/i18n/store';
import type { Locale } from '@/i18n/translations';

const inputClass =
  'w-full rounded-xl border border-[#E8D4D5] bg-white px-4 py-3 text-sm text-charcoal-900 font-sans placeholder:text-[#A89888] focus:outline-none focus:border-[#A96868] focus:ring-2 focus:ring-[#A96868]/10 transition-colors';

const labelClass =
  'mb-1.5 block text-[10px] uppercase tracking-[0.16em] font-semibold text-[#9A7F74] font-sans';

type ApiLocale = 'FR' | 'EN' | 'AR';

interface ProfileData {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  locale?: ApiLocale;
  emailVerified?: boolean;
  createdAt?: string;
  hasPassword?: boolean;
}

const LOCALE_OPTIONS: { api: ApiLocale; ui: Locale; label: string }[] = [
  { api: 'EN', ui: 'en', label: 'English' },
  { api: 'FR', ui: 'fr', label: 'Français' },
  { api: 'AR', ui: 'ar', label: 'العربية' },
];

function toApiLocale(locale: Locale): ApiLocale {
  return locale.toUpperCase() as ApiLocale;
}

function toUiLocale(locale?: ApiLocale): Locale {
  if (locale === 'FR') return 'fr';
  if (locale === 'AR') return 'ar';
  return 'en';
}

export default function ProfilePage() {
  const { t, setLocale, locale } = useLocale();
  const openAccount = useAccountModal((s) => s.open);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    locale: 'EN' as ApiLocale,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      clearAuthTokens();
      setLoading(false);
      openAccount('login');
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`${API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => null);

        if (cancelled) return;

        if (res.status === 401) {
          clearAuthTokens();
          openAccount('login');
          return;
        }

        if (!res.ok || !data?.email) {
          setError(t('account.profileError'));
          return;
        }

        setError('');
        setProfile(data);
        setForm({
          firstName: data.firstName ?? '',
          lastName: data.lastName ?? '',
          phone: data.phone ?? '',
          email: data.email ?? '',
          locale: data.locale ?? toApiLocale(locale),
        });
      } catch {
        if (!cancelled) setError(t('account.profileError'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
    // Load once on mount — avoid refetch after language save
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayName = useMemo(() => {
    const name = [form.firstName, form.lastName].filter(Boolean).join(' ').trim();
    return name || form.email || 'mDISCOVER';
  }, [form.email, form.firstName, form.lastName]);

  const initials = useMemo(() => {
    const a = form.firstName?.trim()?.[0];
    const b = form.lastName?.trim()?.[0];
    if (a || b) return `${a ?? ''}${b ?? ''}`.toUpperCase();
    return (form.email?.[0] ?? 'M').toUpperCase();
  }, [form.email, form.firstName, form.lastName]);

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-MA' : locale === 'fr' ? 'fr-MA' : 'en-GB', {
        year: 'numeric',
        month: 'long',
      })
    : null;

  function formatApiError(err: unknown, fallback: string) {
    if (!err || typeof err !== 'object') return fallback;
    const message = (err as { message?: unknown }).message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) return message.join(', ');
    return fallback;
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError('');

    const token = getAccessToken();
    if (!token) {
      openAccount('login');
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/users/me`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          locale: form.locale,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(formatApiError(data, t('account.profileError')));
        return;
      }

      setProfile((prev) => (prev ? { ...prev, ...data } : prev));
      setLocale(toUiLocale(data.locale ?? form.locale));
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch {
      setError(t('account.profileError'));
    } finally {
      setSaving(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError('');
    setPasswordMessage('');

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError(t('account.passwordMismatch'));
      return;
    }

    setPasswordSaving(true);
    const token = getAccessToken();
    try {
      const res = await fetch(`${API_URL}/users/me/password`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setPasswordError(
          typeof data.message === 'string'
            ? data.message
            : Array.isArray(data.message)
              ? data.message.join(', ')
              : t('account.profileError'),
        );
        return;
      }

      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordMessage(t('account.passwordUpdated'));
      setTimeout(() => setPasswordMessage(''), 2500);
    } catch {
      setPasswordError(t('account.profileError'));
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <AccountShell title={t('account.profileTitle')} eyebrow={t('account.myAccount')}>
      {loading ? (
        <p className="py-16 text-center font-sans text-charcoal-500">{t('account.loadingProfile')}</p>
      ) : error && !profile ? (
        <p className="py-16 text-center font-sans text-red-700">{error}</p>
      ) : (
        <div className="space-y-8">
          <section className="relative overflow-hidden rounded-[24px] border border-[#E8D4D5]/80 bg-[#FFF9F5] shadow-[0_18px_50px_rgba(169,104,104,0.08)]">
            <div
              className="pointer-events-none absolute inset-0 opacity-90"
              style={{
                background:
                  'radial-gradient(ellipse 55% 70% at 12% 20%, rgb(232 212 213 / 0.55), transparent 60%), radial-gradient(ellipse 45% 55% at 90% 80%, rgb(201 165 168 / 0.28), transparent 65%)',
              }}
              aria-hidden
            />
            <div className="relative flex flex-col gap-6 p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-full border border-white/70 bg-[#A96868] font-serif text-2xl sm:text-3xl text-[#FFF9F5] shadow-[0_10px_28px_rgba(169,104,104,0.28)]">
                  {initials}
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-[#B77D7E] font-sans font-medium">
                    {t('account.myAccount')}
                  </p>
                  <h2 className="mt-1 font-serif text-2xl sm:text-3xl text-[#1C1714] tracking-tight">
                    {displayName}
                  </h2>
                  <p className="mt-1 text-sm text-charcoal-500 font-sans">{form.email}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {memberSince && (
                      <span className="rounded-full border border-[#E8D4D5] bg-white/70 px-3 py-1 text-[10px] uppercase tracking-[0.12em] text-charcoal-600 font-sans">
                        {t('account.memberSince')} {memberSince}
                      </span>
                    )}
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.12em] font-sans ${
                        profile?.emailVerified
                          ? 'bg-[#E8F5EE] text-[#2F6B4F]'
                          : 'bg-[#F8F2ED] text-[#9A7F74]'
                      }`}
                    >
                      {profile?.emailVerified ? t('account.verified') : t('account.unverified')}
                    </span>
                  </div>
                </div>
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-charcoal-500 font-sans md:text-right">
                {t('account.profileLead')}
              </p>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <form
              onSubmit={saveProfile}
              className="rounded-[22px] border border-[#E8D4D5]/80 bg-[#FFF9F5] p-5 sm:p-7 shadow-[0_10px_36px_rgba(169,104,104,0.06)]"
            >
              <div className="mb-6 flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-[#A96868]/10 text-[#A96868]">
                  <UserRound size={16} strokeWidth={1.7} />
                </span>
                <div>
                  <h3 className="font-serif text-xl text-[#1C1714]">{t('account.personalInfo')}</h3>
                  <p className="mt-1 text-sm text-charcoal-500 font-sans">{t('account.personalInfoHint')}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={labelClass}>{t('account.email')}</label>
                  <input readOnly value={form.email} className={`${inputClass} bg-[#F8F2ED] text-charcoal-500`} />
                  <p className="mt-1.5 text-[11px] text-[#A89888] font-sans">{t('account.emailReadonly')}</p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>{t('account.firstName')}</label>
                    <input
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      className={inputClass}
                      placeholder={t('account.firstName')}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>{t('account.lastName')}</label>
                    <input
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      className={inputClass}
                      placeholder={t('account.lastName')}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>{t('account.phone')}</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className={inputClass}
                    placeholder="+212 6XX XXX XXX"
                  />
                </div>

                {error && (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 font-sans">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="min-h-[46px] rounded-full bg-[#A96868] px-8 text-[10px] uppercase tracking-[0.16em] font-semibold text-[#FFF9F5] font-sans shadow-[0_8px_22px_rgba(169,104,104,0.24)] hover:bg-[#9B6264] transition-colors disabled:opacity-60"
                >
                  {saving ? t('account.saving') : saved ? t('account.saved') : t('account.saveProfile')}
                </button>
              </div>
            </form>

            <div className="space-y-6">
              <section className="rounded-[22px] border border-[#E8D4D5]/80 bg-[#FFF9F5] p-5 sm:p-6 shadow-[0_10px_36px_rgba(169,104,104,0.06)]">
                <div className="mb-5 flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-[#A96868]/10 text-[#A96868]">
                    <Languages size={16} strokeWidth={1.7} />
                  </span>
                  <div>
                    <h3 className="font-serif text-xl text-[#1C1714]">{t('account.preferences')}</h3>
                    <p className="mt-1 text-sm text-charcoal-500 font-sans">{t('account.preferencesHint')}</p>
                  </div>
                </div>

                <label className={labelClass}>{t('account.language')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {LOCALE_OPTIONS.map((opt) => {
                    const active = form.locale === opt.api;
                    return (
                      <button
                        key={opt.api}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, locale: opt.api }))}
                        className={`rounded-full px-2 py-2.5 text-[10px] uppercase tracking-[0.1em] font-semibold font-sans transition-all ${
                          active
                            ? 'bg-[#A96868] text-[#FFF9F5] shadow-[0_4px_12px_rgba(169,104,104,0.22)]'
                            : 'border border-[#E8D4D5] bg-white text-charcoal-600 hover:border-[#D4A8A4]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-3 text-[11px] text-[#A89888] font-sans">
                  {t('account.saveProfile')} → {t('account.language')}
                </p>
              </section>

              <section className="rounded-[22px] border border-[#E8D4D5]/80 bg-[#FFF9F5] p-5 sm:p-6 shadow-[0_10px_36px_rgba(169,104,104,0.06)]">
                <div className="mb-5 flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-[#A96868]/10 text-[#A96868]">
                    <Shield size={16} strokeWidth={1.7} />
                  </span>
                  <div>
                    <h3 className="font-serif text-xl text-[#1C1714]">{t('account.security')}</h3>
                    <p className="mt-1 text-sm text-charcoal-500 font-sans">{t('account.securityHint')}</p>
                  </div>
                </div>

                {!profile?.hasPassword ? (
                  <p className="rounded-xl border border-dashed border-[#D4A8A4] bg-white/70 px-4 py-3 text-sm text-charcoal-600 font-sans">
                    {t('account.googleAccount')}
                  </p>
                ) : (
                  <form onSubmit={savePassword} className="space-y-3">
                    <div>
                      <label className={labelClass}>{t('account.currentPassword')}</label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={passwords.currentPassword}
                        onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>{t('account.newPassword')}</label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={passwords.newPassword}
                        onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>{t('account.confirmPassword')}</label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={passwords.confirmPassword}
                        onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                        className={inputClass}
                      />
                    </div>

                    {passwordError && (
                      <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 font-sans">
                        {passwordError}
                      </p>
                    )}
                    {passwordMessage && (
                      <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 font-sans">
                        {passwordMessage}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={passwordSaving}
                      className="min-h-[44px] w-full rounded-full border border-[#1C1714] bg-[#1C1714] px-6 text-[10px] uppercase tracking-[0.14em] font-semibold text-[#FFF9F5] font-sans hover:bg-[#2A2320] transition-colors disabled:opacity-60"
                    >
                      {passwordSaving ? t('account.pleaseWait') : t('account.updatePassword')}
                    </button>
                  </form>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </AccountShell>
  );
}
