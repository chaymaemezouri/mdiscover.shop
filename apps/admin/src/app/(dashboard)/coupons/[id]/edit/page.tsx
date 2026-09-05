'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import {
  CouponForm,
  EMPTY_COUPON_FORM,
  type CouponFormState,
} from '@/components/coupons/CouponForm';

type FullCoupon = {
  id: string;
  code: string;
  type: string;
  value: number;
  isActive: boolean;
  maxUses?: number | null;
  minOrderAmount?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  categoryIds?: string[];
};

function toDateInput(iso?: string | null) {
  if (!iso) return '';
  return iso.slice(0, 10);
}

export default function EditCouponPage() {
  const params = useParams<{ id: string }>();
  const [initial, setInitial] = useState<CouponFormState | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;
    adminApi<FullCoupon>(`/admin/coupons/${params.id}`)
      .then((c) => {
        setInitial({
          code: c.code,
          type: c.type,
          value:
            c.type === 'PERCENTAGE' || c.type === 'FREE_SHIPPING' ? c.value : c.value / 100,
          minOrderAmountMad: c.minOrderAmount != null ? String(c.minOrderAmount / 100) : '',
          maxUses: c.maxUses != null ? String(c.maxUses) : '',
          startsAt: toDateInput(c.startsAt),
          expiresAt: toDateInput(c.expiresAt),
          isActive: c.isActive,
          categoryIds: c.categoryIds ?? [],
        });
      })
      .catch(() => setError('Coupon introuvable'))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return <p className="text-sm text-[var(--admin-muted)] py-10">Chargement…</p>;
  }

  if (error || !initial) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600">{error || 'Erreur'}</p>
        <Link href="/coupons" className="admin-btn-outline">
          Retour aux coupons
        </Link>
      </div>
    );
  }

  return (
    <CouponForm
      mode="edit"
      couponId={params.id}
      initial={initial ?? EMPTY_COUPON_FORM}
    />
  );
}
