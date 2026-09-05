'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import {
  ProductForm,
  EMPTY_PRODUCT_FORM,
  type ProductFormState,
} from '@/components/products/ProductForm';

type FullProduct = {
  id: string;
  nameFr: string;
  nameEn?: string;
  slug: string;
  shortDescFr?: string;
  descriptionFr?: string;
  ingredients?: string;
  usage?: string;
  precautions?: string;
  basePrice: number;
  compareAtPrice?: number;
  status: string;
  isNew: boolean;
  isBestseller: boolean;
  isPromo?: boolean;
  hasShippingFee?: boolean;
  skinTypes?: string[];
  seoTitle?: string;
  seoDescription?: string;
  category: { id: string };
  brand?: { id: string; nameFr: string } | null;
  variants: { sku: string; name: string; price: number; stock: number; isDefault?: boolean }[];
  images: { url: string; colorHex?: string | null; colorName?: string | null }[];
};

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const [initial, setInitial] = useState<ProductFormState | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;
    adminApi<FullProduct>(`/admin/products/${params.id}`)
      .then((full) => {
        setInitial({
          nameFr: full.nameFr,
          nameEn: full.nameEn ?? '',
          slug: full.slug,
          shortDescFr: full.shortDescFr ?? '',
          descriptionFr: full.descriptionFr ?? '',
          ingredients: full.ingredients ?? '',
          usage: full.usage ?? '',
          precautions: full.precautions ?? '',
          basePrice: full.basePrice,
          compareAtPrice: full.compareAtPrice ?? 0,
          categoryId: full.category?.id ?? '',
          brandId: full.brand?.id ?? '',
          status: full.status,
          isNew: full.isNew,
          isBestseller: full.isBestseller,
          isPromo: full.isPromo ?? false,
          hasShippingFee: full.hasShippingFee !== false,
          skinTypes: full.skinTypes ?? [],
          seoTitle: full.seoTitle ?? '',
          seoDescription: full.seoDescription ?? '',
          images: (full.images ?? []).map((i) => ({
            url: i.url,
            colorHex: i.colorHex ?? '',
            colorName: i.colorName ?? '',
          })),
          variants:
            full.variants?.length > 0
              ? full.variants.map((v) => ({
                  sku: v.sku,
                  name: v.name,
                  price: v.price,
                  stock: v.stock,
                  isDefault: v.isDefault ?? false,
                }))
              : EMPTY_PRODUCT_FORM.variants,
        });
      })
      .catch(() => setError('Produit introuvable'))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return <p className="text-sm text-[var(--admin-muted)] py-10">Chargement du produit…</p>;
  }

  if (error || !initial) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600">{error || 'Erreur'}</p>
        <Link href="/products" className="admin-btn-outline">
          Retour aux produits
        </Link>
      </div>
    );
  }

  return <ProductForm mode="edit" productId={params.id} initial={initial} />;
}
