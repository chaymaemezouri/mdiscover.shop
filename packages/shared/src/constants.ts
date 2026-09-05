export const APP_NAME = 'mDISCOVER';
export const APP_LOGO = '/logo-clear.png';
export const BRAND_ROSE = '#AC6D6F';

/** Boutique contact — WhatsApp / téléphone */
export const CONTACT_PHONE_DISPLAY = '+212 661-528608';
export const CONTACT_PHONE_E164 = '+212661528608';
export const CONTACT_WHATSAPP_DIGITS = '212661528608';

export type ProductCategoryDef = {
  slug: string;
  nameFr: string;
  nameAr: string;
  nameEn: string;
  parentSlug?: string;
};

export const PRODUCT_CATEGORIES: ProductCategoryDef[] = [
  { slug: 'serums', nameFr: 'Sérums', nameAr: 'السيروم', nameEn: 'Serum' },
  { slug: 'face-cream', nameFr: 'Crème visage', nameAr: 'كريم الوجه', nameEn: 'Face Cream' },
  { slug: 'eye-cream', nameFr: 'Crème yeux', nameAr: 'كريم العين', nameEn: 'Eye Cream' },
  { slug: 'cleanser', nameFr: 'Nettoyant', nameAr: 'منظف', nameEn: 'Cleanser' },
  { slug: 'hair-care', nameFr: 'Soin capillaire', nameAr: 'العناية بالشعر', nameEn: 'Hair Care' },
  { slug: 'shampoo', nameFr: 'Shampooing', nameAr: 'شامبو', nameEn: 'Shampoo' },
  { slug: 'conditioner', nameFr: 'Après-shampooing', nameAr: 'بلسم', nameEn: 'Conditioner' },
  { slug: 'toner', nameFr: 'Tonique', nameAr: 'تونر', nameEn: 'Toner' },
  { slug: 'sun-block', nameFr: 'Protection solaire', nameAr: 'حماية الشمس', nameEn: 'Sun Care' },
  { slug: 'pdrn', nameFr: 'Soin PDRN', nameAr: 'عناية PDRN', nameEn: 'PDRN Care' },
  { slug: 'product-sets', nameFr: 'Coffrets', nameAr: 'الأطقم', nameEn: 'Product Sets' },
  {
    slug: 'trio-haircare-set',
    nameFr: 'Trio Haircare Set',
    nameAr: 'طقم العناية بالشعر',
    nameEn: 'Trio Haircare Set',
    parentSlug: 'product-sets',
  },
  {
    slug: 'glow-on-the-go-set',
    nameFr: 'Glow On The Go Set',
    nameAr: 'طقم Glow On The Go',
    nameEn: 'Glow On The Go Set',
    parentSlug: 'product-sets',
  },
  { slug: 'parfums', nameFr: 'Parfums', nameAr: 'العطور', nameEn: 'Perfumes' },
];

export const PRODUCT_BRANDS = [
  { slug: 'mdiscover', nameFr: 'mDISCOVER', nameAr: 'م ديسكوفر', nameEn: 'mDISCOVER' },
  { slug: 'gold-caviar', nameFr: 'Gold & Caviar', nameAr: 'ذهب وكافيار', nameEn: 'Gold & Caviar' },
] as const;

/** Main storefront navigation (English labels) */
export const NAV_LINKS = [
  { href: '/products?onSale=true', label: 'Offers' },
  { href: '/products?promo=true', label: 'Promo' },
  { href: '/products?isNew=true', label: 'New' },
  { href: '/marques', label: 'Brands' },
  { href: '/categories', label: 'Categories' },
] as const;

export const SKIN_TYPES = [
  { slug: 'normale', nameFr: 'Normale', nameEn: 'Normal' },
  { slug: 'seche', nameFr: 'Sèche', nameEn: 'Dry' },
  { slug: 'grasse', nameFr: 'Grasse', nameEn: 'Oily' },
  { slug: 'mixte', nameFr: 'Mixte', nameEn: 'Combination' },
  { slug: 'sensible', nameFr: 'Sensible', nameEn: 'Sensitive' },
] as const;

export const FREE_SHIPPING_THRESHOLD_MAD = 50000; // 500 MAD in centimes

export const API_PREFIX = '/api/v1';
