export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

interface FetchOptions extends RequestInit {
  sessionId?: string;
  token?: string;
}

export async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { sessionId, token, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  if (sessionId) headers['x-session-id'] = sessionId;
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${endpoint}`, {
      cache: 'no-store',
      ...rest,
      headers,
    });
  } catch {
    throw new Error('Unable to reach the API. Make sure the backend is running on port 4000.');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Erreur réseau' }));
    throw new Error(error.message ?? `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  products: {
    list: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params)}` : '';
      return apiFetch<{ data: Product[]; meta: PaginationMeta }>(`/products${query}`);
    },
    featured: () => apiFetch<{ newProducts: Product[]; bestsellers: Product[] }>('/products/featured'),
    bySlug: (slug: string) => apiFetch<ProductDetail>(`/products/${slug}`),
  },
  categories: {
    list: () => apiFetch<Category[]>('/categories'),
  },
  brands: {
    list: () => apiFetch<Brand[]>('/brands'),
  },
  cart: {
    get: (sessionId: string) => apiFetch<Cart>(`/cart`, { sessionId }),
    addItem: (sessionId: string, data: { productId: string; variantId?: string; quantity: number }) =>
      apiFetch<Cart>(`/cart/items`, { method: 'POST', body: JSON.stringify(data), sessionId }),
    updateItem: (cartId: string, sessionId: string, itemId: string, quantity: number) =>
      apiFetch<Cart>(`/cart/items/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity }),
        sessionId,
        headers: { 'x-cart-id': cartId },
      }),
    removeItem: (cartId: string, sessionId: string, itemId: string) =>
      apiFetch<Cart>(`/cart/items/${itemId}`, {
        method: 'DELETE',
        sessionId,
        headers: { 'x-cart-id': cartId },
      }),
  },
  newsletter: {
    subscribe: (email: string) =>
      apiFetch('/newsletter/subscribe', { method: 'POST', body: JSON.stringify({ email }) }),
  },
  contact: {
    send: (data: { name: string; email: string; phone?: string; message: string }) =>
      apiFetch<{ id: string }>('/contact', { method: 'POST', body: JSON.stringify(data) }),
  },
  coupons: {
    validate: (code: string, subtotal: number) =>
      apiFetch<{ discount: number; freeShipping: boolean }>('/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({ code, subtotal }),
      }),
  },
};

export interface Product {
  id: string;
  slug: string;
  name: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  isNew: boolean;
  isBestseller: boolean;
  category: { slug: string; name: string };
  images: { url: string; alt?: string }[];
}

export interface ProductDetail extends Product {
  description: string;
  ingredients?: string;
  usage?: string;
  precautions?: string;
  variants: {
    id: string;
    sku: string;
    name: string;
    price: number;
    stock: number;
    attributes: Record<string, string>;
  }[];
  reviews: {
    id: string;
    rating: number;
    title?: string;
    comment?: string;
    user: { firstName?: string; lastName?: string };
  }[];
}

export interface Category {
  id: string;
  slug: string;
  nameFr: string;
  nameEn?: string;
  description?: string | null;
  imageUrl?: string | null;
  productCount: number;
  children?: {
    id?: string;
    slug: string;
    nameFr: string;
    nameEn?: string;
    productCount?: number;
  }[];
}

export interface Brand {
  id: string;
  slug: string;
  nameEn: string;
  nameFr: string;
  logoUrl?: string;
  productCount: number;
}

export interface Cart {
  id: string;
  items: {
    id: string;
    productId: string;
    variantId?: string | null;
    quantity: number;
    unitPrice: number;
    product: { name: string; slug: string; image?: string };
    variant?: { name: string };
  }[];
  subtotal: number;
  itemCount: number;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
