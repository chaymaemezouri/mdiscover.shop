'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import { Star, Check, X } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  title?: string;
  comment?: string;
  createdAt: string;
  product: { nameFr: string; slug: string };
  user: { email: string };
}

export default function ReviewsAdminPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    adminApi<Review[]>('/admin/reviews/pending')
      .then(setReviews)
      .catch(console.error)
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  async function moderate(id: string, status: 'APPROVED' | 'REJECTED') {
    await adminApi(`/admin/reviews/${id}/${status}`, { method: 'PUT' });
    setReviews((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-semibold">Modération des avis</h1>
        <p className="text-[var(--admin-muted)] text-sm mt-1">{reviews.length} avis en attente</p>
      </div>

      <div className="admin-card">
        {loading ? (
          <p className="text-center py-8 text-[var(--admin-muted)]">Chargement...</p>
        ) : reviews.length === 0 ? (
          <p className="text-center py-8 text-[var(--admin-muted)]">Aucun avis à modérer</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="border border-[var(--admin-line)] rounded-lg p-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <Link href={`/products`} className="text-sm text-[var(--admin-rose)] hover:underline">
                      {r.product.nameFr}
                    </Link>
                    <p className="text-xs text-[var(--admin-muted)] mt-1">{r.user.email}</p>
                    <div className="flex items-center gap-1 mt-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={i < r.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-300'}
                        />
                      ))}
                    </div>
                    {r.title && <p className="font-medium mt-2">{r.title}</p>}
                    {r.comment && <p className="text-sm text-[var(--admin-muted)] mt-1">{r.comment}</p>}
                    <p className="text-xs text-[var(--admin-muted)] mt-2">
                      {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => moderate(r.id, 'APPROVED')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200"
                    >
                      <Check size={14} /> Approuver
                    </button>
                    <button
                      onClick={() => moderate(r.id, 'REJECTED')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200"
                    >
                      <X size={14} /> Rejeter
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
