import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ProductStatus,
  ShipmentStatus,
} from './enums';

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ProductListItem {
  id: string;
  slug: string;
  name: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  status: ProductStatus;
  isNew: boolean;
  isBestseller: boolean;
  category: { id: string; slug: string; name: string };
  images: { url: string; alt?: string }[];
  averageRating?: number;
  reviewCount?: number;
}

export interface ProductDetail extends ProductListItem {
  description: string;
  ingredients?: string;
  usage?: string;
  precautions?: string;
  seoTitle?: string;
  seoDescription?: string;
  variants: ProductVariantDto[];
}

export interface ProductVariantDto {
  id: string;
  sku: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  attributes: Record<string, string>;
}

export interface CartItemDto {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  product: {
    name: string;
    slug: string;
    image?: string;
  };
  variant?: { name: string };
}

export interface CartDto {
  id: string;
  items: CartItemDto[];
  subtotal: number;
  itemCount: number;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  shipmentStatus?: ShipmentStatus;
  trackingNumber?: string;
  createdAt: string;
  itemCount: number;
}

export interface AddressDto {
  id?: string;
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  region?: string;
  postalCode?: string;
  country: string;
  isDefault?: boolean;
}
