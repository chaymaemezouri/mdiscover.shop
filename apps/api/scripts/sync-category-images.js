require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const EXT = {
  parfums: 'jpeg',
};

async function main() {
  const cats = await prisma.category.findMany({
    select: { id: true, slug: true, nameFr: true, imageUrl: true },
    orderBy: { sortOrder: 'asc' },
  });
  console.log('BEFORE', JSON.stringify(cats, null, 2));

  for (const c of cats) {
    if (c.slug === 'tsttttt') continue;
    const ext = EXT[c.slug] || 'jpeg';
    const imageUrl = `/categories/${c.slug}.${ext}`;
    await prisma.category.update({
      where: { id: c.id },
      data: { imageUrl },
    });
    console.log('SET', c.slug, '->', imageUrl);
  }

  const after = await prisma.category.findMany({
    select: { slug: true, imageUrl: true },
    orderBy: { sortOrder: 'asc' },
  });
  console.log('AFTER', JSON.stringify(after, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
