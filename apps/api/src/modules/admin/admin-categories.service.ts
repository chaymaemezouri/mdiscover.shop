import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

function slugify(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

@Injectable()
export class AdminCategoriesService {
  constructor(private prisma: PrismaService) {}

  findAll(search?: string, isActive?: string) {
    const where: Prisma.CategoryWhereInput = {};
    if (search?.trim()) {
      const q = search.trim();
      where.OR = [
        { nameFr: { contains: q, mode: 'insensitive' } },
        { nameEn: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (isActive === 'true') where.isActive = true;
    if (isActive === 'false') where.isActive = false;

    return this.prisma.category.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { nameFr: 'asc' }],
      include: {
        parent: { select: { id: true, nameFr: true } },
        _count: { select: { products: true, children: true } },
      },
    });
  }

  async findOne(id: string) {
    const cat = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, nameFr: true } },
        children: { select: { id: true, nameFr: true, slug: true, isActive: true }, orderBy: { sortOrder: 'asc' } },
        _count: { select: { products: true, children: true } },
      },
    });
    if (!cat) throw new NotFoundException('Catégorie introuvable');
    return cat;
  }

  async create(data: {
    nameFr: string;
    nameEn?: string;
    nameAr?: string;
    slug?: string;
    description?: string;
    imageUrl?: string;
    parentId?: string | null;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    const slug = data.slug?.trim() || slugify(data.nameFr);
    const existing = await this.prisma.category.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('Slug déjà utilisé');

    if (data.parentId) {
      const parent = await this.prisma.category.findUnique({ where: { id: data.parentId } });
      if (!parent) throw new NotFoundException('Catégorie parent introuvable');
    }

    return this.prisma.category.create({
      data: {
        nameFr: data.nameFr,
        nameEn: data.nameEn,
        nameAr: data.nameAr,
        slug,
        description: data.description,
        imageUrl: data.imageUrl,
        parentId: data.parentId || null,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
      },
      include: {
        parent: { select: { id: true, nameFr: true } },
        _count: { select: { products: true, children: true } },
      },
    });
  }

  async update(
    id: string,
    data: {
      nameFr?: string;
      nameEn?: string;
      nameAr?: string;
      slug?: string;
      description?: string;
      imageUrl?: string | null;
      parentId?: string | null;
      sortOrder?: number;
      isActive?: boolean;
    },
  ) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Catégorie introuvable');

    if (data.slug && data.slug !== cat.slug) {
      const existing = await this.prisma.category.findUnique({ where: { slug: data.slug } });
      if (existing) throw new ConflictException('Slug déjà utilisé');
    }

    if (data.parentId === id) {
      throw new ConflictException('Une catégorie ne peut pas être son propre parent');
    }

    if (data.parentId) {
      // Prevent setting a descendant as parent (simple one-level check + walk)
      let walkId: string | null = data.parentId;
      const seen = new Set<string>([id]);
      while (walkId) {
        if (seen.has(walkId)) {
          throw new ConflictException('Parent invalide (cycle détecté)');
        }
        seen.add(walkId);
        const node = await this.prisma.category.findUnique({
          where: { id: walkId },
          select: { parentId: true },
        });
        walkId = node?.parentId ?? null;
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        nameFr: data.nameFr,
        nameEn: data.nameEn,
        nameAr: data.nameAr,
        slug: data.slug,
        description: data.description,
        imageUrl: data.imageUrl,
        parentId: data.parentId === undefined ? undefined : data.parentId || null,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      },
      include: {
        parent: { select: { id: true, nameFr: true } },
        _count: { select: { products: true, children: true } },
      },
    });
  }

  async remove(id: string) {
    const cat = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true, children: true } } },
    });
    if (!cat) throw new NotFoundException('Catégorie introuvable');
    if (cat._count.products > 0) {
      throw new ConflictException('Des produits utilisent cette catégorie');
    }
    if (cat._count.children > 0) {
      throw new ConflictException('Supprimez d’abord les sous-catégories');
    }
    return this.prisma.category.delete({ where: { id } });
  }
}
