const API_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL ?? 'http://localhost:4000/api/v1';

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_token');
}

export async function adminApi<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAdminToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  if (res.status === 401) {
    window.location.href = '/admin/login';
    throw new Error('Non autorisé');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Erreur ${res.status}`);
  }
  return res.json();
}

export async function adminUpload(file: File): Promise<{ url: string; id?: string }> {
  const token = getAdminToken();
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_URL}/admin/upload/image`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (res.status === 401) {
    window.location.href = '/admin/login';
    throw new Error('Non autorisé');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({} as { message?: string }));
    const msg = Array.isArray(err.message) ? err.message.join(', ') : err.message;
    throw new Error(msg || `Upload échoué (${res.status})`);
  }
  return res.json();
}

export interface AdminProduct {
  id: string;
  slug: string;
  nameFr: string;
  basePrice: number;
  compareAtPrice?: number;
  status: string;
  isNew: boolean;
  isBestseller: boolean;
  hasShippingFee?: boolean;
  category: { id: string; nameFr: string };
  variants: { id: string; sku: string; name: string; price: number; stock: number }[];
  images: { url: string }[];
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  status: string;
  subtotal?: number;
  shippingCost?: number;
  discount?: number;
  tax?: number;
  total: number;
  currency?: string;
  guestEmail?: string | null;
  notes?: string | null;
  shippingAddress?: Record<string, string> | null;
  billingAddress?: Record<string, string> | null;
  createdAt: string;
  updatedAt?: string;
  payment?: {
    method: string;
    status: string;
    amount?: number;
    refundedAmount?: number;
  } | null;
  shipment?: {
    trackingNumber?: string | null;
    status: string;
    shippingZone?: string | null;
    estimatedDelivery?: string | null;
    deliveredAt?: string | null;
    labelUrl?: string | null;
  } | null;
  coupon?: { id: string; code: string; type: string; value: number } | null;
  user?: {
    id?: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
  } | null;
  items: {
    id?: string;
    name: string;
    sku?: string;
    quantity: number;
    unitPrice: number;
    total?: number;
    productId?: string;
  }[];
  statusHistory?: {
    id: string;
    status: string;
    note?: string | null;
    createdBy?: string | null;
    createdAt: string;
  }[];
}

export interface Category {
  id: string;
  slug: string;
  nameFr: string;
}
