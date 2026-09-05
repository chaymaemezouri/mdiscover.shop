import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BrandsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const brands = await this.prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { products: { where: { status: 'PUBLISHED', deletedAt: null } } } },
      },
    });

    return brands.map((b) => ({
      id: b.id,
      slug: b.slug,
      nameFr: b.nameFr,
      nameAr: b.nameAr,
      nameEn: b.nameEn,
      logoUrl: b.logoUrl,
      productCount: b._count.products,
    }));
  }
}
