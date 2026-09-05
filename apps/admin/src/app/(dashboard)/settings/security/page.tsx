'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { adminApi } from '@/lib/api';

type ProfileForm = {
  email: string;
  firstName: string;
  lastName: string;
};

export default function SettingsSecurityPage() {
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi<{ email?: string; firstName?: string; lastName?: string }>('/admin/me')
      .then((p) =>
        setForm({
          email: p.email ?? '',
          firstName: p.firstName ?? '',
          lastName: p.lastName ?? '',
        }),
      )
      .catch(() => setError('Impossible de charger le profil'));
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSavingProfile(true);
    setMessage('');
    setError('');
    try {
      const updated = await adminApi<ProfileForm>('/admin/me', {
        method: 'PUT',
        body: JSON.stringify({
          email: form.email.trim(),
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
        }),
      });
      setForm({
        email: updated.email,
        firstName: updated.firstName,
        lastName: updated.lastName,
      });
      setMessage('Profil enregistré');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    setError('');
    if (newPassword.length < 8) {
      setError('Le nouveau mot de passe doit faire au moins 8 caractères');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('La confirmation ne correspond pas');
      return;
    }
    setSavingPassword(true);
    try {
      await adminApi('/admin/me/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage('Mot de passe mis à jour');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSavingPassword(false);
    }
  }

  if (!form && !error) {
    return <p className="text-sm text-[var(--admin-muted)] py-10">Chargement…</p>;
  }

  return (
    <div className="w-full space-y-5">
      <div className="flex items-start gap-3">
        <Link href="/settings" className="admin-btn-ghost mt-0.5">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold">Sécurité</h1>
          <p className="text-sm text-[var(--admin-muted)]">Compte admin et mot de passe</p>
        </div>
      </div>

      {(message || error) && (
        <p
          className={`text-sm rounded-md px-3 py-2 border ${
            error
              ? 'text-red-600 bg-red-50 border-red-100'
              : 'text-emerald-700 bg-emerald-50 border-emerald-100'
          }`}
        >
          {error || message}
        </p>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <form onSubmit={saveProfile} className="admin-card space-y-3">
          <h2 className="text-sm font-semibold">Compte</h2>
          <div>
            <label className="admin-label">Email</label>
            <input
              type="email"
              required
              className="admin-input"
              value={form?.email ?? ''}
              onChange={(e) => form && setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="admin-label">Prénom</label>
              <input
                required
                className="admin-input"
                value={form?.firstName ?? ''}
                onChange={(e) => form && setForm({ ...form, firstName: e.target.value })}
              />
            </div>
            <div>
              <label className="admin-label">Nom</label>
              <input
                required
                className="admin-input"
                value={form?.lastName ?? ''}
                onChange={(e) => form && setForm({ ...form, lastName: e.target.value })}
              />
            </div>
          </div>
          <button type="submit" disabled={savingProfile || !form} className="admin-btn text-sm">
            {savingProfile ? 'Enregistrement…' : 'Enregistrer le profil'}
          </button>
        </form>

        <form onSubmit={savePassword} className="admin-card space-y-3">
          <h2 className="text-sm font-semibold">Mot de passe</h2>
          <div>
            <label className="admin-label">Mot de passe actuel</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              className="admin-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="admin-label">Nouveau mot de passe</label>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="admin-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="admin-label">Confirmer</label>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="admin-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <button type="submit" disabled={savingPassword} className="admin-btn text-sm">
            {savingPassword ? 'Mise à jour…' : 'Changer le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
}
