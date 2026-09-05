'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import { BrandForm, EMPTY_BRAND, type BrandFormState } from '@/components/brands/BrandForm';

type FullBrand = BrandFormState & { id: string };

export default function EditBrandPage() {
  const params = useParams<{ id: string }>();
  const [initial, setInitial] = useState<BrandFormState | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;
    adminApi<FullBrand>(`/admin/brands/${params.id}`)
      .then((b) =>
        setInitial({
          nameFr: b.nameFr ?? '',
          nameEn: b.nameEn ?? '',
          slug: b.slug ?? '',
          sortOrder: b.sortOrder ?? 0,
          isActive: Boolean(b.isActive),
        }),
      )
      .catch(() => setError('Marque introuvable'))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <p className="text-sm text-[var(--admin-muted)] py-10">Chargement…</p>;
  if (error || !initial) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600">{error || 'Erreur'}</p>
        <Link href="/brands" className="admin-btn-outline">
          Retour
        </Link>
      </div>
    );
  }

  return <BrandForm mode="edit" brandId={params.id} initial={initial ?? EMPTY_BRAND} />;
}
