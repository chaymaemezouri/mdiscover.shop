export const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
] as const;

export type OrderStatusValue = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  PROCESSING: 'En préparation',
  SHIPPED: 'Expédiée',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
  REFUNDED: 'Remboursée',
};

export const ORDER_TRANSITIONS: Partial<Record<string, string[]>> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['REFUNDED'],
};

export function orderStatusBadgeClass(status: string) {
  switch (status) {
    case 'PENDING':
      return 'admin-badge-black';
    case 'CONFIRMED':
    case 'PROCESSING':
      return 'admin-badge-rose';
    case 'SHIPPED':
      return 'admin-badge-ok';
    case 'DELIVERED':
      return 'admin-badge-ok';
    case 'CANCELLED':
    case 'REFUNDED':
      return 'admin-badge-black';
    default:
      return 'admin-badge-rose';
  }
}

export function paymentStatusLabel(status?: string) {
  if (!status) return '—';
  const map: Record<string, string> = {
    PENDING: 'En attente',
    PAID: 'Payé',
    FAILED: 'Échoué',
    REFUNDED: 'Remboursé',
    PARTIALLY_REFUNDED: 'Remb. partiel',
  };
  return map[status] ?? status;
}
