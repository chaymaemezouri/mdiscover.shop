'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { Recaptcha, type RecaptchaRef } from '@/components/auth/Recaptcha';
import { storeAuthTokens } from '@/lib/auth-client';
import { API_URL } from '@/lib/api';
import { useLocale } from '@/i18n/store';

const inputClass =
  'w-full rounded-xl border border-[#E8D4D5] bg-white px-4 py-3 text-sm text-charcoal-900 font-sans placeholder:text-[#A89888] focus:outline-none focus:border-[#A96868] focus:ring-2 focus:ring-[#A96868]/10 transition-colors';

const DEMO_ACCOUNT = {
  email: 'client@example.com',
  password: 'Client123!',
} as const;

const SHOW_DEMO_LOGIN = process.env.NEXT_PUBLIC_SHOW_DEMO_LOGIN === 'true';

interface AccountAuthPanelProps {
  initialEmail?: string;
  initialMode?: 'login' | 'register';
  compact?: boolean;
  variant?: 'page' | 'modal';
  onModeChange?: (mode: 'login' | 'register') => void;
  onAuthenticated?: () => void;
}

export function AccountAuthPanel({
  initialEmail = '',
  initialMode = 'login',
  compact = false,
  variant = 'page',
  onModeChange,
  onAuthenticated,
}: AccountAuthPanelProps) {
  const { t } = useLocale();
  const isModal = variant === 'modal';
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [form, setForm] = useState({
    email: initialEmail,
    password: '',
    firstName: '',
    lastName: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const recaptchaRef = useRef<RecaptchaRef>(null);

  useEffect(() => {
    if (initialEmail) {
      setForm((f) => ({ ...f, email: initialEmail }));
    }
  }, [initialEmail]);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  function switchMode(next: 'login' | 'register') {
    setMode(next);
    setError('');
    onModeChange?.(next);
  }

  function finishAuth(data: { accessToken: string; refreshToken: string }) {
    onAuthenticated?.();
    storeAuthTokens(data);
  }

  const handleGoogle = useCallback(async (idToken: string) => {
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      if (res.ok) {
        finishAuth(await res.json());
      } else {
        setError('Google sign-in failed. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onAuthenticated]);

  async function tryAdminLogin(email: string, password: string) {
    const res = await fetch(`${API_URL}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_token', data.accessToken);
      if (data.refreshToken) localStorage.setItem('admin_refresh_token', data.refreshToken);
    }
    return data;
  }

  async function loginWithCredentials(email: string, password: string) {
    setError('');
    setSubmitting(true);
    switchMode('login');
    setForm((f) => ({ ...f, email, password }));

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        finishAuth(await res.json());
        return;
      }

      const admin = await tryAdminLogin(email, password);
      if (admin) {
        onAuthenticated?.();
        window.location.href = '/admin';
        return;
      }

      const err = await res.json().catch(() => ({}));
      setError(
        Array.isArray(err.message)
          ? err.message.join(', ')
          : err.message ?? 'Sign-in failed. Run API seed if demo account is missing.',
      );
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDemoLogin() {
    await loginWithCredentials(DEMO_ACCOUNT.email, DEMO_ACCOUNT.password);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (mode === 'login') {
      try {
        const res = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email, password: form.password }),
        });

        if (res.ok) {
          finishAuth(await res.json());
          return;
        }

        const admin = await tryAdminLogin(form.email, form.password);
        if (admin) {
          onAuthenticated?.();
          window.location.href = '/admin';
          return;
        }

        const err = await res.json().catch(() => ({}));
        setError(Array.isArray(err.message) ? err.message.join(', ') : err.message ?? 'Sign-in failed');
        recaptchaRef.current?.reset();
      } catch {
        setError('Network error. Please try again.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const body = {
      ...form,
      recaptchaToken: recaptchaRef.current?.getToken() || undefined,
    };

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        finishAuth(await res.json());
      } else {
        const err = await res.json().catch(() => ({}));
        setError(Array.isArray(err.message) ? err.message.join(', ') : err.message ?? 'Sign-in failed');
        recaptchaRef.current?.reset();
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={compact || isModal ? 'w-full' : 'w-full max-w-md mx-auto lg:mx-0'}>
      {isModal ? (
        <>
          <p className="text-[10px] uppercase tracking-[0.24em] text-[#B77D7E] font-sans font-medium mb-2">
            {t('account.eyebrow')}
          </p>
          <p className="text-[15px] sm:text-base leading-relaxed text-charcoal-800 font-sans pr-2">
            {mode === 'login' ? (
              <>
                <span className="font-semibold text-charcoal-900">{t('account.signIn')}</span>{' '}
                {t('account.modalLoginLead')}
              </>
            ) : (
              <>
                <span className="font-semibold text-charcoal-900">{t('account.createAccount')}</span>{' '}
                {t('account.modalRegisterLead')}
              </>
            )}
          </p>
        </>
      ) : (
        !compact && (
          <>
            <p className="text-[10px] uppercase tracking-[0.24em] text-[#B77D7E] font-sans font-medium mb-2">
              {t('account.eyebrow')}
            </p>
            <h1 className="font-serif text-2xl sm:text-3xl text-charcoal-900 tracking-tight mb-2">
              {t('account.welcome')}
            </h1>
            <p className="text-sm text-charcoal-500 font-sans mb-8 leading-relaxed">
              {t('account.subtitle')}
            </p>
          </>
        )
      )}

      {!isModal && (
        <div className="flex rounded-full border border-[#E8D4D5] bg-[#FFF9F5] p-1 mb-6 mt-0">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`flex-1 rounded-full py-2.5 text-[10px] uppercase tracking-[0.14em] font-semibold font-sans transition-all ${
              mode === 'login'
                ? 'bg-[#A96868] text-[#FFF9F5] shadow-[0_4px_12px_rgba(169,104,104,0.22)]'
                : 'text-charcoal-600 hover:text-[#A96868]'
            }`}
          >
            {t('account.signIn')}
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`flex-1 rounded-full py-2.5 text-[10px] uppercase tracking-[0.14em] font-semibold font-sans transition-all ${
              mode === 'register'
                ? 'bg-[#A96868] text-[#FFF9F5] shadow-[0_4px_12px_rgba(169,104,104,0.22)]'
                : 'text-charcoal-600 hover:text-[#A96868]'
            }`}
          >
            {t('account.register')}
          </button>
        </div>
      )}

      <div className={isModal ? 'mt-6' : ''}>
        <GoogleSignInButton onSuccess={handleGoogle} disabled={submitting} />
      </div>

      {SHOW_DEMO_LOGIN && (
        <div className="mt-4 rounded-[16px] border border-dashed border-[#D4A8A4] bg-[#FFF9F5] px-4 py-3.5">
          <p className="text-[10px] uppercase tracking-[0.14em] font-semibold text-[#A96868] font-sans mb-1.5">
            Demo account
          </p>
          <p className="text-xs text-charcoal-500 font-sans leading-relaxed mb-3">
            {DEMO_ACCOUNT.email} · {DEMO_ACCOUNT.password}
          </p>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={submitting}
            className="w-full min-h-[44px] rounded-full border border-[#1C1714] bg-[#1C1714] text-[#FFF9F5] text-[10px] uppercase tracking-[0.14em] font-semibold font-sans hover:bg-[#2A2320] transition-colors disabled:opacity-60"
          >
            {submitting ? 'Connecting...' : 'Connect with demo'}
          </button>
        </div>
      )}

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#E8D4D5]" />
        </div>
        <div className="relative flex justify-center">
          <span
            className={`px-3 text-[10px] uppercase tracking-[0.16em] text-charcoal-400 font-sans ${
              isModal ? 'bg-[#FFF9F5]' : 'bg-[#FBF8F4]'
            }`}
          >
            {t('account.or')}
          </span>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className={
          isModal
            ? 'space-y-3'
            : 'space-y-4 rounded-[20px] border border-[#E8D4D5] bg-[#FFF9F5] p-5 sm:p-6 shadow-[0_8px_32px_rgba(169,104,104,0.06)]'
        }
      >
        {mode === 'register' && (
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder={t('account.firstName')}
              required
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              className={inputClass}
            />
            <input
              placeholder={t('account.lastName')}
              required
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              className={inputClass}
            />
          </div>
        )}
        <input
          placeholder={t('account.email')}
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className={inputClass}
        />
        <input
          placeholder={t('account.password')}
          type="password"
          required
          minLength={8}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className={inputClass}
        />
        {mode === 'register' && <Recaptcha ref={recaptchaRef} />}
        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 font-sans">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full min-h-[48px] rounded-full bg-[#A96868] text-[#FFF9F5] text-[10px] uppercase tracking-[0.16em] font-semibold font-sans shadow-[0_4px_14px_rgba(169,104,104,0.28)] hover:bg-[#9B6264] transition-colors disabled:opacity-60"
        >
          {submitting
            ? t('account.pleaseWait')
            : mode === 'login'
              ? t('account.continue')
              : t('account.createAccount')}
        </button>
      </form>

      {isModal ? (
        <p className="mt-4 text-sm text-charcoal-500 font-sans">
          {mode === 'login' ? (
            <>
              {t('account.noAccount')}{' '}
              <button
                type="button"
                onClick={() => switchMode('register')}
                className="text-[#A96868] font-medium hover:text-[#9B6264] transition-colors"
              >
                {t('account.createOne')}
              </button>
            </>
          ) : (
            <>
              {t('account.hasAccount')}{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-[#A96868] font-medium hover:text-[#9B6264] transition-colors"
              >
                {t('account.signIn')}
              </button>
            </>
          )}
        </p>
      ) : (
        !compact && (
          <p className="text-center text-sm text-charcoal-500 font-sans mt-6">
            <a href="/compte/commandes" className="text-[#A96868] hover:text-[#9B6264] font-medium transition-colors">
              {t('account.viewOrders')}
            </a>
          </p>
        )
      )}
    </div>
  );
}
