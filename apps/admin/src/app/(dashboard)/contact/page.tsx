'use client';

import { useCallback, useEffect, useState } from 'react';
import { Mail, Search, Trash2, Check, Eye } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { adminConfirm } from '@/lib/admin-dialog';

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
};

type Meta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
};

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('fr-MA', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function ContactMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: 30, totalPages: 1, unreadCount: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ContactMessage | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: '30' });
      if (status) qs.set('status', status);
      if (search.trim()) qs.set('search', search.trim());
      const res = await adminApi<{ data: ContactMessage[]; meta: Meta }>(
        `/admin/contact-messages?${qs}`,
      );
      setMessages(res.data ?? []);
      setMeta(res.meta ?? { total: 0, page: 1, limit: 30, totalPages: 1, unreadCount: 0 });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => {
    const t = setTimeout(() => void load(), search ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  useEffect(() => {
    setPage(1);
  }, [status, search]);

  async function openMessage(msg: ContactMessage) {
    setSelected(msg);
    if (!msg.isRead) {
      try {
        await adminApi(`/admin/contact-messages/${msg.id}/read`, {
          method: 'PUT',
          body: JSON.stringify({ isRead: true }),
        });
        setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, isRead: true } : m)));
        setSelected((s) => (s?.id === msg.id ? { ...s, isRead: true } : s));
        setMeta((m) => ({ ...m, unreadCount: Math.max(0, m.unreadCount - 1) }));
      } catch {
        /* ignore */
      }
    }
  }

  async function remove(id: string) {
    if (!(await adminConfirm('Supprimer ce message ?'))) return;
    await adminApi(`/admin/contact-messages/${id}`, { method: 'DELETE' });
    if (selected?.id === id) setSelected(null);
    void load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Messages contact</h1>
          <p className="text-sm text-[var(--admin-muted)]">
            Formulaires envoyés depuis la boutique
            {meta.unreadCount > 0 ? ` · ${meta.unreadCount} non lu${meta.unreadCount > 1 ? 's' : ''}` : ''}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-muted)]" />
          <input
            className="admin-input pl-9"
            placeholder="Rechercher…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {(
          [
            ['', 'Tous'],
            ['unread', 'Non lus'],
            ['read', 'Lus'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={label}
            type="button"
            onClick={() => setStatus(value)}
            className={status === value ? 'admin-btn text-xs py-1.5 px-3' : 'admin-btn-outline text-xs py-1.5 px-3'}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-4 items-start">
        <div className="admin-card overflow-hidden p-0">
          {loading ? (
            <p className="p-6 text-sm text-[var(--admin-muted)]">Chargement…</p>
          ) : messages.length === 0 ? (
            <div className="p-10 text-center text-sm text-[var(--admin-muted)]">
              <Mail className="mx-auto mb-3 opacity-40" size={28} />
              Aucun message pour le moment
            </div>
          ) : (
            <table className="admin-table w-full text-sm">
              <thead>
                <tr>
                  <th className="pl-5">De</th>
                  <th>Aperçu</th>
                  <th>Date</th>
                  <th className="pr-5" />
                </tr>
              </thead>
              <tbody>
                {messages.map((m) => (
                  <tr
                    key={m.id}
                    className={`hover:bg-black/[0.015] cursor-pointer ${!m.isRead ? 'bg-[var(--admin-rose)]/[0.04]' : ''}`}
                    onClick={() => void openMessage(m)}
                  >
                    <td className="pl-5">
                      <div className="flex items-center gap-2">
                        {!m.isRead && (
                          <span className="h-2 w-2 rounded-full bg-[var(--admin-rose)] shrink-0" />
                        )}
                        <div>
                          <p className={`font-medium ${!m.isRead ? 'text-[var(--admin-ink)]' : ''}`}>{m.name}</p>
                          <p className="text-[11px] text-[var(--admin-muted)]">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[280px]">
                      <p className="truncate text-[var(--admin-muted)]">{m.message}</p>
                    </td>
                    <td className="whitespace-nowrap text-[12px] text-[var(--admin-muted)]">
                      {formatDate(m.createdAt)}
                    </td>
                    <td className="pr-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="admin-btn-ghost text-red-500"
                        onClick={() => void remove(m.id)}
                        title="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[var(--admin-line)] px-5 py-3 text-sm">
              <span className="text-[var(--admin-muted)]">
                Page {meta.page} / {meta.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  className="admin-btn-outline text-xs py-1.5"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Préc.
                </button>
                <button
                  type="button"
                  disabled={page >= meta.totalPages}
                  className="admin-btn-outline text-xs py-1.5"
                  onClick={() => setPage((p) => p + 1)}
                >
                  Suiv.
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="admin-card sticky top-4 min-h-[280px]">
          {selected ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-base">{selected.name}</p>
                  <a href={`mailto:${selected.email}`} className="text-sm text-[var(--admin-rose)] hover:underline">
                    {selected.email}
                  </a>
                  {selected.phone && (
                    <p className="text-sm text-[var(--admin-muted)] mt-0.5">{selected.phone}</p>
                  )}
                </div>
                <span className={selected.isRead ? 'admin-badge-ok' : 'admin-badge-black'}>
                  {selected.isRead ? (
                    <span className="inline-flex items-center gap-1">
                      <Check size={12} /> Lu
                    </span>
                  ) : (
                    'Nouveau'
                  )}
                </span>
              </div>
              <p className="text-[11px] text-[var(--admin-muted)]">{formatDate(selected.createdAt)}</p>
              <div className="rounded-md border border-[var(--admin-line)] bg-white px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
                {selected.message}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <a
                  href={`mailto:${selected.email}?subject=${encodeURIComponent('Re: mDISCOVER')}`}
                  className="admin-btn text-xs py-1.5 px-3 inline-flex items-center gap-1.5"
                >
                  <Mail size={13} /> Répondre
                </a>
                <button
                  type="button"
                  className="admin-btn-outline text-xs py-1.5 px-3 text-red-600"
                  onClick={() => void remove(selected.id)}
                >
                  Supprimer
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center text-sm text-[var(--admin-muted)]">
              <Eye size={22} className="mb-2 opacity-40" />
              Sélectionnez un message
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
