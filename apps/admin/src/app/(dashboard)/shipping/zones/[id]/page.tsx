'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import {
  EMPTY_ZONE,
  ShippingZoneForm,
  type ZoneFormState,
} from '@/components/shipping/ShippingZoneForm';

type FullZone = {
  id: string;
  name: string;
  cities: string[];
  regions: string[];
  price: number;
  freeAbove?: number | null;
  isActive: boolean;
};

export default function EditShippingZonePage() {
  const params = useParams<{ id: string }>();
  const [initial, setInitial] = useState<ZoneFormState | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;
    adminApi<FullZone>(`/admin/shipping/zones/${params.id}`)
      .then((z) =>
        setInitial({
          name: z.name ?? '',
          cities: (z.cities ?? []).join(', '),
          regions: (z.regions ?? []).join(', '),
          priceMad: ((z.price ?? 0) / 100).toFixed(2),
          freeAboveMad: z.freeAbove != null ? (z.freeAbove / 100).toFixed(2) : '',
          isActive: Boolean(z.isActive),
        }),
      )
      .catch(() => setError('Zone introuvable'))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <p className="text-sm text-[var(--admin-muted)] py-10">Chargement…</p>;
  if (error || !initial) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600">{error || 'Erreur'}</p>
        <Link href="/shipping/zones" className="admin-btn-outline">
          Retour
        </Link>
      </div>
    );
  }

  return <ShippingZoneForm mode="edit" zoneId={params.id} initial={initial ?? EMPTY_ZONE} />;
}
