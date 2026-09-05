/**
 * Update production admin password without full re-seed.
 *
 * Usage (from apps/api, with DATABASE_URL set):
 *   ADMIN_SEED_PASSWORD='your-password' npx ts-node prisma/set-admin-password.ts
 *
 * Or with default from this file if env unset.
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL ?? 'admin@mdiscover.ma';
  const password = process.env.ADMIN_SEED_PASSWORD ?? 'mDscvr#9K!pL2$xR7wQ@n';
  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash, status: 'ACTIVE', role: 'SUPER_ADMIN' },
    create: {
      email,
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
    },
  });

  console.log(`✅ Admin updated: ${admin.email}`);
  console.log(`   Password: ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
