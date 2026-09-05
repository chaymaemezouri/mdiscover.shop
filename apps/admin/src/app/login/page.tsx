'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { APP_NAME } from '@mdiscovershop/shared';

const ADMIN_API_URL =
  process.env.NEXT_PUBLIC_ADMIN_API_URL ?? 'http://localhost:4000/api/v1';

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', totp: '' });
  const [needsTotp, setNeedsTotp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${ADMIN_API_URL}/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = typeof err.message === 'object' ? err.message : err;
        if (msg?.code === 'TOTP_REQUIRED') {
          setNeedsTotp(true);
          setError('Entrez le code 2FA');
          return;
        }
        throw new Error('Identifiants invalides');
      }
      const data = await res.json();
      localStorage.setItem('admin_token', data.accessToken);
      if (data.refreshToken) localStorage.setItem('admin_refresh_token', data.refreshToken);
      router.push('/');
    } catch {
      setError('Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--admin-bg)] px-4">
      <div className="w-full max-w-sm bg-white border border-[var(--admin-line)] rounded-lg p-7">
        <div className="flex justify-center mb-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/admin/logo-clear.png"
            alt={APP_NAME}
            width={200}
            height={72}
            className="h-10 w-auto object-contain"
          />
        </div>
        <p className="text-sm text-[var(--admin-muted)] text-center mb-6">Connexion admin</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="admin-label">Email</label>
            <input
              type="email"
              required
              autoComplete="username"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="admin-input"
              placeholder="admin@mdiscover.ma"
            />
          </div>
          <div>
            <label className="admin-label">Mot de passe</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="admin-input"
            />
          </div>
          {(needsTotp || form.totp) && (
            <div>
              <label className="admin-label">Code 2FA</label>
              <input
                type="text"
                inputMode="numeric"
                value={form.totp}
                onChange={(e) => setForm({ ...form, totp: e.target.value })}
                className="admin-input"
              />
            </div>
          )}
          {error && <p className="text-sm text-[var(--admin-rose)]">{error}</p>}
          <button type="submit" disabled={loading} className="admin-btn w-full">
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
