'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import {
  CategoryForm,
  EMPTY_CATEGORY_FORM,
  type CategoryFormState,
} from '@/components/categories/CategoryForm';

type FullCategory = {
  id: string;
  nameFr: string;
  nameEn?: string | null;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  parentId?: string | null;
  sortOrder: number;
  isActive: boolean;
  children?: { id: string }[];
};

export default function EditCategoryPage() {
  const params = useParams<{ id: string }>();
  const [initial, setInitial] = useState<CategoryFormState | null>(null);
  const [childIds, setChildIds] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;
    adminApi<FullCategory>(`/admin/categories/${params.id}`)
      .then((full) => {
        setInitial({
          nameFr: full.nameFr,
          nameEn: full.nameEn ?? '',
          slug: full.slug,
          description: full.description ?? '',
          imageUrl: full.imageUrl ?? '',
          parentId: full.parentId ?? '',
          sortOrder: full.sortOrder ?? 0,
          isActive: full.isActive,
        });
        setChildIds((full.children ?? []).map((c) => c.id));
      })
      .catch(() => setError('Catégorie introuvable'))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return <p className="text-sm text-[var(--admin-muted)] py-10">Chargement…</p>;
  }

  if (error || !initial) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600">{error || 'Erreur'}</p>
        <Link href="/categories" className="admin-btn-outline">
          Retour aux catégories
        </Link>
      </div>
    );
  }

  return (
    <CategoryForm
      mode="edit"
      categoryId={params.id}
      initial={initial ?? EMPTY_CATEGORY_FORM}
      excludeParentIds={childIds}
    />
  );
}
