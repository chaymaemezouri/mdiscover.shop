require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.category
  .updateMany({
    where: { slug: { in: ['trio-haircare-set', 'glow-on-the-go-set'] } },
    data: { imageUrl: null },
  })
  .then((r) => {
    console.log(r);
    return prisma.$disconnect();
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
