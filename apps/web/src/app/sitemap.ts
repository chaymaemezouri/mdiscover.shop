import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  return [
    { url: base, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/products`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/blog`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/contact`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/pages/a-propos`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/pages/cgv`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${base}/pages/faq`, changeFrequency: 'monthly', priority: 0.5 },
  ];
}
