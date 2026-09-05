import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

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
export class AdminBrandsService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string, isActive?: string) {
    const where: Prisma.BrandWhereInput = {};
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

    return this.prisma.brand.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { nameFr: 'asc' }],
      include: { _count: { select: { products: true } } },
    });
  }

  async findOne(id: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!brand) throw new NotFoundException('Marque introuvable');
    return brand;
  }

  async create(data: Record<string, unknown>) {
    const nameFr = String(data.nameFr ?? '').trim();
    const nameEn = String(data.nameEn ?? data.nameFr ?? '').trim() || nameFr;
    if (!nameFr) throw new BadRequestException('Nom requis');

    const slug = ((data.slug as string)?.trim() || slugify(nameFr)).toLowerCase();
    if (!slug) throw new BadRequestException('Slug invalide');

    const existing = await this.prisma.brand.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('Slug déjà utilisé');

    return this.prisma.brand.create({
      data: {
        slug,
        nameFr,
        nameEn,
        nameAr: (data.nameAr as string)?.trim() || null,
        logoUrl: (data.logoUrl as string)?.trim() || null,
        sortOrder: Number(data.sortOrder) || 0,
        isActive: data.isActive === undefined ? true : Boolean(data.isActive),
      },
    });
  }

  async update(id: string, data: Record<string, unknown>) {
    const brand = await this.findOne(id);

    if (data.slug !== undefined) {
      const slug = slugify(String(data.slug));
      if (!slug) throw new BadRequestException('Slug invalide');
      if (slug !== brand.slug) {
        const existing = await this.prisma.brand.findUnique({ where: { slug } });
        if (existing) throw new ConflictException('Slug déjà utilisé');
      }
      data.slug = slug;
    }

    return this.prisma.brand.update({
      where: { id },
      data: {
        ...(data.slug !== undefined && { slug: String(data.slug) }),
        ...(data.nameFr !== undefined && { nameFr: String(data.nameFr).trim() }),
        ...(data.nameEn !== undefined && {
          nameEn: String(data.nameEn || data.nameFr || brand.nameFr).trim(),
        }),
        ...(data.nameAr !== undefined && { nameAr: (data.nameAr as string)?.trim() || null }),
        ...(data.logoUrl !== undefined && { logoUrl: (data.logoUrl as string)?.trim() || null }),
        ...(data.sortOrder !== undefined && { sortOrder: Number(data.sortOrder) || 0 }),
        ...(data.isActive !== undefined && { isActive: Boolean(data.isActive) }),
      },
    });
  }

  async remove(id: string) {
    const brand = await this.findOne(id);
    if (brand._count.products > 0) {
      throw new ConflictException(
        `Impossible de supprimer : ${brand._count.products} produit(s) lié(s). Retirez la marque des produits ou désactivez-la.`,
      );
    }
    return this.prisma.brand.delete({ where: { id } });
  }
}
