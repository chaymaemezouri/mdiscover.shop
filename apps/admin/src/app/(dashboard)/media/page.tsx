'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminApi, adminUpload } from '@/lib/api';
import { adminAlert, adminConfirm } from '@/lib/admin-dialog';
import { Copy, Trash2, Upload } from 'lucide-react';

type MediaItem = {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

export default function MediaAdminPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await adminApi<{ data: MediaItem[] }>('/admin/media?page=1&limit=60');
      setItems(res.data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await adminUpload(file);
      }
      void load();
    } catch (err) {
      await adminAlert({ message: err instanceof Error ? err.message : 'Upload échoué', variant: 'error' });
    } finally {
      setUploading(false);
    }
  }

  async function remove(id: string) {
    if (!(await adminConfirm('Supprimer ce fichier ?'))) return;
    try {
      await adminApi(`/admin/media/${id}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      await adminAlert({ message: err instanceof Error ? err.message : 'Erreur', variant: 'error' });
    }
  }

  function copyUrl(url: string) {
    void navigator.clipboard.writeText(url);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Médiathèque</h1>
          <p className="text-sm text-[var(--admin-muted)] mt-0.5">{items.length} images</p>
        </div>
        <label className="admin-btn cursor-pointer">
          <Upload size={16} />
          {uploading ? 'Upload…' : 'Uploader'}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={uploading}
            onChange={(e) => void onUpload(e.target.files)}
          />
        </label>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--admin-muted)] py-10">Chargement…</p>
      ) : items.length === 0 ? (
        <div className="admin-card text-center py-12 text-sm text-[var(--admin-muted)]">
          Aucune image. Uploadez pour commencer.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
          {items.map((item) => (
            <div key={item.id} className="admin-card p-2 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.filename}
                className="aspect-square w-full object-cover rounded bg-black/5"
              />
              <p className="mt-2 text-[11px] truncate" title={item.filename}>
                {item.filename}
              </p>
              <p className="text-[10px] text-[var(--admin-muted)]">
                {(item.size / 1024).toFixed(0)} Ko
              </p>
              <div className="mt-1 flex gap-1 opacity-80 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => copyUrl(item.url)}
                  className="admin-btn-ghost text-xs px-1.5"
                  title="Copier URL"
                >
                  <Copy size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  className="admin-btn-ghost text-xs px-1.5 text-red-500"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
