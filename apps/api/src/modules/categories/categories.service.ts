import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true, parentId: null },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            _count: { select: { products: { where: { status: 'PUBLISHED' } } } },
          },
        },
        _count: { select: { products: { where: { status: 'PUBLISHED' } } } },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return categories.map((c) => {
      const children = c.children.map((ch) => ({
        id: ch.id,
        slug: ch.slug,
        nameFr: ch.nameFr,
        nameAr: ch.nameAr,
        nameEn: ch.nameEn,
        productCount: ch._count.products,
      }));
      const childrenCount = children.reduce((sum, ch) => sum + ch.productCount, 0);

      return {
        id: c.id,
        slug: c.slug,
        nameFr: c.nameFr,
        nameAr: c.nameAr,
        nameEn: c.nameEn,
        description: c.description,
        imageUrl: c.imageUrl,
        productCount: c._count.products + childrenCount,
        children,
      };
    });
  }
}
