/** Resolve category image for admin UI (storefront public files). */
export function categoryImageSrc(imageUrl?: string | null, slug?: string) {
  const store = (process.env.NEXT_PUBLIC_STORE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const raw =
    imageUrl?.trim() ||
    (slug ? `/categories/${slug}.jpeg` : '');
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw) || raw.startsWith('data:')) return raw;
  return `${store}${raw.startsWith('/') ? raw : `/${raw}`}`;
}
