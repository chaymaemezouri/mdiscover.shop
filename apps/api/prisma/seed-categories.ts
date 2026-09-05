/**
 * Upsert storefront carousel categories (names + images + descriptions).
 * Safe for production — does not seed products or reset admin password.
 *
 * Usage (apps/api, DATABASE_URL set):
 *   APP_URL=https://mdiscover.shop npx ts-node prisma/seed-categories.ts
 *
 * Or in Docker:
 *   docker exec -w /app kamira-api-prod node ... (see PROD.md)
 */
import { PrismaClient } from '@prisma/client';
import { PRODUCT_CATEGORIES } from '../../../packages/shared/src/constants';

const prisma = new PrismaClient();

/** Matches CategoryCarousel CATEGORY_PRESENTATION (homepage section). */
const CATEGORY_META: Record<string, { description: string; imageFile: string }> = {
  serums: {
    description: 'Potent formulas for radiance, firmness and deep skin renewal.',
    imageFile: 'serums.jpeg',
  },
  'face-cream': {
    description: 'Silky creams that nourish and restore your natural barrier.',
    imageFile: 'face-cream.jpeg',
  },
  'eye-cream': {
    description: 'Brightening care for the fragile eye contour area.',
    imageFile: 'eye-cream.jpeg',
  },
  cleanser: {
    description: 'Gentle cleansers that purify without stripping moisture.',
    imageFile: 'cleanser.jpeg',
  },
  'hair-care': {
    description: 'Luxury formulas for stronger, shinier and healthier hair.',
    imageFile: 'hair-care.jpeg',
  },
  shampoo: {
    description: 'Soft shampoos that respect the scalp and daily balance.',
    imageFile: 'shampoo.jpeg',
  },
  conditioner: {
    description: 'Conditioning treatments for smooth, manageable hair.',
    imageFile: 'conditioner.jpeg',
  },
  toner: {
    description: 'Refining toners that restore pH before your treatment.',
    imageFile: 'toner.jpeg',
  },
  'sun-block': {
    description: 'Lightweight SPF shields with a comfortable, sheer finish.',
    imageFile: 'sun-block.jpeg',
  },
  pdrn: {
    description: 'Regenerative PDRN care for elasticity and visible renewal.',
    imageFile: 'pdrn.jpeg',
  },
  'product-sets': {
    description: 'Complete routines thoughtfully paired for visible results.',
    imageFile: 'product-sets.jpeg',
  },
  parfums: {
    description: 'Elegant fragrances that complete your beauty ritual.',
    imageFile: 'parfums.jpeg',
  },
};

function imageUrlFor(slug: string): string | null {
  const meta = CATEGORY_META[slug];
  if (!meta) return null;
  const base = (process.env.APP_URL || 'https://mdiscover.shop').replace(/\/$/, '');
  return `${base}/categories/${meta.imageFile}`;
}

async function main() {
  console.log('🌱 Seeding categories from storefront carousel…');

  let sortOrder = 0;
  for (const cat of PRODUCT_CATEGORIES.filter((c) => !c.parentSlug)) {
    const meta = CATEGORY_META[cat.slug];
    const imageUrl = imageUrlFor(cat.slug);
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        nameFr: cat.nameFr,
        nameAr: cat.nameAr,
        nameEn: cat.nameEn,
        description: meta?.description ?? undefined,
        imageUrl: imageUrl ?? undefined,
        sortOrder,
        parentId: null,
        isActive: true,
      },
      create: {
        slug: cat.slug,
        nameFr: cat.nameFr,
        nameAr: cat.nameAr,
        nameEn: cat.nameEn,
        description: meta?.description ?? null,
        imageUrl,
        sortOrder,
        isActive: true,
      },
    });
    sortOrder += 1;
    console.log(`  ✓ ${cat.slug}${imageUrl ? ` → ${imageUrl}` : ''}`);
  }

  for (const cat of PRODUCT_CATEGORIES.filter((c) => c.parentSlug)) {
    const parent = await prisma.category.findUnique({ where: { slug: cat.parentSlug! } });
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        nameFr: cat.nameFr,
        nameAr: cat.nameAr,
        nameEn: cat.nameEn,
        sortOrder,
        parentId: parent?.id ?? null,
        isActive: true,
      },
      create: {
        slug: cat.slug,
        nameFr: cat.nameFr,
        nameAr: cat.nameAr,
        nameEn: cat.nameEn,
        sortOrder,
        parentId: parent?.id,
        isActive: true,
      },
    });
    sortOrder += 1;
    console.log(`  ✓ ${cat.slug} (child of ${cat.parentSlug})`);
  }

  const count = await prisma.category.count();
  console.log(`✅ Categories ready (${count} total)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
