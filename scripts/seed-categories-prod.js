/**
 * Run on VPS:
 *   docker cp scripts/seed-categories-prod.js kamira-api-prod:/tmp/seed-categories-prod.js
 *   docker exec -w /app -e APP_URL=https://mdiscover.shop kamira-api-prod node /tmp/seed-categories-prod.js
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const base = (process.env.APP_URL || 'https://mdiscover.shop').replace(/\/$/, '');

const cats = [
  ['serums', 'Sérums', 'السيروم', 'Serum', 'Potent formulas for radiance, firmness and deep skin renewal.', 'serums.jpeg'],
  ['face-cream', 'Crème visage', 'كريم الوجه', 'Face Cream', 'Silky creams that nourish and restore your natural barrier.', 'face-cream.jpeg'],
  ['eye-cream', 'Crème yeux', 'كريم العين', 'Eye Cream', 'Brightening care for the fragile eye contour area.', 'eye-cream.jpeg'],
  ['cleanser', 'Nettoyant', 'منظف', 'Cleanser', 'Gentle cleansers that purify without stripping moisture.', 'cleanser.jpeg'],
  ['hair-care', 'Soin capillaire', 'العناية بالشعر', 'Hair Care', 'Luxury formulas for stronger, shinier and healthier hair.', 'hair-care.jpeg'],
  ['shampoo', 'Shampooing', 'شامبو', 'Shampoo', 'Soft shampoos that respect the scalp and daily balance.', 'shampoo.jpeg'],
  ['conditioner', 'Après-shampooing', 'بلسم', 'Conditioner', 'Conditioning treatments for smooth, manageable hair.', 'conditioner.jpeg'],
  ['toner', 'Tonique', 'تونر', 'Toner', 'Refining toners that restore pH before your treatment.', 'toner.jpeg'],
  ['sun-block', 'Protection solaire', 'حماية الشمس', 'Sun Care', 'Lightweight SPF shields with a comfortable, sheer finish.', 'sun-block.jpeg'],
  ['pdrn', 'Soin PDRN', 'عناية PDRN', 'PDRN Care', 'Regenerative PDRN care for elasticity and visible renewal.', 'pdrn.jpeg'],
  ['product-sets', 'Coffrets', 'الأطقم', 'Product Sets', 'Complete routines thoughtfully paired for visible results.', 'product-sets.jpeg'],
  ['parfums', 'Parfums', 'العطور', 'Perfumes', 'Elegant fragrances that complete your beauty ritual.', 'parfums.jpeg'],
];

(async () => {
  let i = 0;
  for (const [slug, nameFr, nameAr, nameEn, description, file] of cats) {
    const imageUrl = `${base}/categories/${file}`;
    await prisma.category.upsert({
      where: { slug },
      update: {
        nameFr,
        nameAr,
        nameEn,
        description,
        imageUrl,
        sortOrder: i,
        parentId: null,
        isActive: true,
      },
      create: {
        slug,
        nameFr,
        nameAr,
        nameEn,
        description,
        imageUrl,
        sortOrder: i,
        isActive: true,
      },
    });
    console.log('OK', slug, imageUrl);
    i += 1;
  }
  console.log('TOTAL', await prisma.category.count());
  await prisma.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
