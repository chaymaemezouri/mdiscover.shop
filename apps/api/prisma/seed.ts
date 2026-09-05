import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PRODUCT_CATEGORIES, PRODUCT_BRANDS } from '../../../packages/shared/src/constants';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const adminPassword = await bcrypt.hash('Admin123!', 12);
  await prisma.adminUser.upsert({
    where: { email: 'admin@mdiscover.ma' },
    update: {},
    create: {
      email: 'admin@mdiscover.ma',
      passwordHash: adminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
    },
  });

  const customerPassword = await bcrypt.hash('Client123!', 12);
  await prisma.user.upsert({
    where: { email: 'client@example.com' },
    update: {},
    create: {
      email: 'client@example.com',
      passwordHash: customerPassword,
      firstName: 'Fatima',
      lastName: 'Benali',
      phone: '+212612345678',
    },
  });

  let sortOrder = 0;
  for (const cat of PRODUCT_CATEGORIES.filter((c) => !c.parentSlug)) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        nameFr: cat.nameFr,
        nameAr: cat.nameAr,
        nameEn: cat.nameEn,
        sortOrder,
        parentId: null,
      },
      create: {
        slug: cat.slug,
        nameFr: cat.nameFr,
        nameAr: cat.nameAr,
        nameEn: cat.nameEn,
        sortOrder,
      },
    });
    sortOrder += 1;
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
      },
      create: {
        slug: cat.slug,
        nameFr: cat.nameFr,
        nameAr: cat.nameAr,
        nameEn: cat.nameEn,
        sortOrder,
        parentId: parent?.id,
      },
    });
    sortOrder += 1;
  }

  for (const [index, brand] of PRODUCT_BRANDS.entries()) {
    await prisma.brand.upsert({
      where: { slug: brand.slug },
      update: {},
      create: {
        slug: brand.slug,
        nameFr: brand.nameFr,
        nameAr: brand.nameAr,
        nameEn: brand.nameEn,
        sortOrder: index,
      },
    });
  }

  const mdiscoverBrand = await prisma.brand.findUnique({ where: { slug: 'mdiscover' } });
  const goldCaviarBrand = await prisma.brand.findUnique({ where: { slug: 'gold-caviar' } });

  const serumsCategory = await prisma.category.findUnique({ where: { slug: 'serums' } });
  const faceCreamCategory = await prisma.category.findUnique({ where: { slug: 'face-cream' } });

  const products = [
    {
      slug: 'gold-caviar-serum',
      nameFr: 'Gold & Caviar Serum',
      nameEn: 'Gold & Caviar Serum',
      shortDescFr: 'Sérum raffermissant intemporel · Or 24K & extrait de caviar',
      descriptionFr:
        'Sérum luxueux MDISCOVER enrichi à l\'or 24 carats et à l\'extrait de caviar. Formule concentrée pour une peau éclatante, repulpée et visiblement plus jeune.',
      basePrice: 89000,
      compareAtPrice: 99000,
      categoryId: serumsCategory!.id,
      brandId: goldCaviarBrand!.id,
      isNew: true,
      isBestseller: true,
      isPromo: true,
      ingredients: 'Aqua, Gold Extract, Caviar Extract, Hyaluronic Acid, Vitamin E',
      usage: 'Appliquer matin et soir sur peau propre avant la crème.',
      skinTypes: ['normale', 'seche', 'mixte'],
      variants: [
        { sku: 'GCS-30ML', name: '30 ml', price: 89000, stock: 50 },
        { sku: 'GCS-50ML', name: '50 ml', price: 129000, stock: 30 },
      ],
      image: '/hero.jpeg',
    },
    {
      slug: 'gold-caviar-cream',
      nameFr: 'Gold & Caviar Cream',
      nameEn: 'Gold & Caviar Cream',
      shortDescFr: 'Crème raffermissante intemporelle · Or 24K & extrait de caviar',
      descriptionFr:
        'Crème MDISCOVER signature aux microparticules d\'or et à l\'extrait de caviar. Nourrit intensément, raffermit et révèle un éclat doré naturel.',
      basePrice: 89000,
      compareAtPrice: 99000,
      categoryId: faceCreamCategory!.id,
      brandId: goldCaviarBrand!.id,
      isNew: true,
      isBestseller: true,
      isPromo: true,
      ingredients: 'Aqua, Shea Butter, Gold Particles, Caviar Extract, Squalane',
      usage: 'Appliquer matin et soir sur le visage et le cou.',
      skinTypes: ['seche', 'normale', 'mixte'],
      variants: [{ sku: 'GCC-50ML', name: '50 ml', price: 89000, stock: 45 }],
      image: '/hero.jpeg',
    },
    {
      slug: 'gold-caviar-lotion',
      nameFr: 'Gold & Caviar Lotion',
      nameEn: 'Gold & Caviar Lotion',
      shortDescFr: 'Lotion hydratante luxe · Or 24K & extrait de caviar',
      descriptionFr:
        'Lotion fluide MDISCOVER pour une hydratation quotidienne. Texture légère, fini satiné, enrichie à l\'or et au caviar.',
      basePrice: 79000,
      categoryId: faceCreamCategory!.id,
      brandId: mdiscoverBrand!.id,
      isBestseller: true,
      ingredients: 'Aqua, Glycerin, Gold Extract, Caviar Extract, Niacinamide',
      usage: 'Appliquer matin et soir après le sérum.',
      skinTypes: ['normale', 'mixte', 'grasse'],
      variants: [{ sku: 'GCL-50ML', name: '50 ml', price: 79000, stock: 40 }],
      image: '/hero.jpeg',
    },
    {
      slug: 'gold-caviar-concentrate',
      nameFr: 'Gold & Caviar Concentrate',
      nameEn: 'Gold & Caviar Concentrate',
      shortDescFr: 'Concentré régénérant · Or 24K & extrait de caviar',
      descriptionFr:
        'Concentré MDISCOVER haute performance pour les zones nécessitant une attention particulière. Puissance anti-âge maximale.',
      basePrice: 99000,
      categoryId: serumsCategory!.id,
      brandId: goldCaviarBrand!.id,
      isNew: true,
      ingredients: 'Caviar Extract, Gold Particles, Peptides, Retinol, Vitamin E',
      usage: 'Appliquer quelques gouttes localement, soir uniquement.',
      skinTypes: ['normale', 'seche'],
      variants: [{ sku: 'GCCON-15ML', name: '15 ml', price: 99000, stock: 35 }],
      image: '/hero.jpeg',
    },
  ];

  for (const p of products) {
    const { variants, image, ...productData } = p;
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        nameFr: productData.nameFr,
        nameEn: productData.nameEn,
        shortDescFr: productData.shortDescFr,
        descriptionFr: productData.descriptionFr,
        basePrice: productData.basePrice,
        compareAtPrice: productData.compareAtPrice,
        categoryId: productData.categoryId,
        isNew: productData.isNew ?? false,
        isBestseller: productData.isBestseller ?? false,
        isPromo: productData.isPromo ?? false,
        brandId: productData.brandId,
        ingredients: productData.ingredients,
        usage: productData.usage,
        skinTypes: productData.skinTypes,
        status: 'PUBLISHED',
      },
      create: {
        ...productData,
        status: 'PUBLISHED',
        variants: {
          create: variants.map((v, i) => ({
            ...v,
            isDefault: i === 0,
            attributes: { volume: v.name },
          })),
        },
        images: {
          create: [{ url: image, alt: p.nameFr, isPrimary: true, sortOrder: 0 }],
        },
      },
    });

    const existingImage = await prisma.productImage.findFirst({
      where: { productId: product.id, isPrimary: true },
    });
    if (existingImage) {
      await prisma.productImage.update({
        where: { id: existingImage.id },
        data: { url: image, alt: p.nameFr },
      });
    } else {
      await prisma.productImage.create({
        data: { productId: product.id, url: image, alt: p.nameFr, isPrimary: true, sortOrder: 0 },
      });
    }

    console.log(`  ✓ Product: ${product.nameFr}`);
  }

  await prisma.coupon.upsert({
    where: { code: 'BIENVENUE10' },
    update: {},
    create: {
      code: 'BIENVENUE10',
      type: 'PERCENTAGE',
      value: 10,
      minOrderAmount: 30000,
      maxUses: 1000,
      isActive: true,
    },
  });

  await prisma.homeBanner.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      titleFr: 'Collection Gold & Caviar',
      subtitleFr: 'MDISCOVER — L\'excellence cosmétique à l\'or 24 carats',
      imageUrl: '/hero.jpeg',
      linkUrl: '/products?category=serums',
      sortOrder: 0,
    },
  });

  await prisma.shippingZone.createMany({
    data: [
      { name: 'Casablanca', cities: ['Casablanca'], regions: ['Casablanca-Settat'], price: 2500, freeAbove: 50000 },
      { name: 'Rabat & Salé', cities: ['Rabat', 'Salé', 'Témara'], regions: ['Rabat-Salé-Kénitra'], price: 3000, freeAbove: 50000 },
      { name: 'Autres villes', cities: [], regions: [], price: 4500, freeAbove: 80000 },
    ],
    skipDuplicates: true,
  });

  await prisma.page.createMany({
    data: [
      {
        slug: 'a-propos',
        titleFr: 'À propos',
        contentFr: '<p>mDISCOVER incarne l\'excellence de la beauté marocaine, alliant traditions ancestrales et innovation scientifique.</p>',
      },
      {
        slug: 'cgv',
        titleFr: 'Conditions Générales de Vente',
        contentFr: '<p>Conditions générales de vente de mDISCOVER.</p>',
      },
      {
        slug: 'confidentialite',
        titleFr: 'Politique de confidentialité',
        contentFr: '<p>Politique de protection des données personnelles.</p>',
      },
      {
        slug: 'faq',
        titleFr: 'Questions fréquentes',
        contentFr: '<h3>Livraison</h3><p>Nous livrons partout au Maroc via Amana Express sous 2 à 5 jours ouvrés.</p><h3>Paiement</h3><p>Carte bancaire (Stripe) ou paiement à la livraison.</p><h3>Retours</h3><p>Retours acceptés sous 14 jours pour produits non ouverts.</p>',
      },
      {
        slug: 'mentions-legales',
        titleFr: 'Mentions légales',
        contentFr: '<p>mDISCOVER — Maroc</p>',
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Seed completed!');
  console.log('   Admin: admin@mdiscover.ma / Admin123!');
  console.log('   Client: client@example.com / Client123!');

  await prisma.siteSetting.createMany({
    data: [
      {
        key: 'general',
        value: {
          contactEmail: 'contact@mdiscover.ma',
          phone: '+212 661-528608',
          whatsapp: '+212661528608',
          address: 'Maroc',
          instagram: 'https://instagram.com/mdiscover',
          facebook: '',
          youtube: '',
        },
      },
      {
        key: 'shipping',
        value: {
          freeShippingThreshold: 50000,
          bannerMessage: 'Paiement sécurisé · Paiement à la livraison',
        },
      },
      {
        key: 'store',
        value: { maintenanceMode: false, allowGuestCheckout: true },
      },
    ],
    skipDuplicates: true,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
