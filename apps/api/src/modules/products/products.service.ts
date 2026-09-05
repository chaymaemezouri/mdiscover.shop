import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductQueryDto } from './dto/product-query.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: ProductQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.PUBLISHED,
      deletedAt: null,
    };

    if (query.category) where.category = { slug: query.category };
    if (query.search) {
      where.OR = [
        { nameFr: { contains: query.search, mode: 'insensitive' } },
        { nameEn: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.isNew) where.isNew = true;
    if (query.isBestseller) where.isBestseller = true;
    if (query.isPromo) where.isPromo = true;
    if (query.brand) where.brand = { slug: query.brand, isActive: true };
    if (query.onSale) {
      const saleRows = await this.prisma.$queryRaw<{ id: string }[]>(
        Prisma.sql`
          SELECT id FROM products
          WHERE compare_at_price IS NOT NULL
            AND compare_at_price > base_price
            AND status = 'PUBLISHED'
            AND deleted_at IS NULL
        `,
      );
      where.id = { in: saleRows.map((r) => r.id) };
    }
    if (query.minPrice || query.maxPrice) {
      where.basePrice = {};
      if (query.minPrice) where.basePrice.gte = query.minPrice;
      if (query.maxPrice) where.basePrice.lte = query.maxPrice;
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput = {};
    switch (query.sort) {
      case 'price_asc':
        orderBy.basePrice = 'asc';
        break;
      case 'price_desc':
        orderBy.basePrice = 'desc';
        break;
      case 'newest':
        orderBy.createdAt = 'desc';
        break;
      default:
        orderBy.isBestseller = 'desc';
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: { select: { id: true, slug: true, nameFr: true } },
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
          variants: { where: { isDefault: true }, take: 1 },
          _count: { select: { reviews: { where: { status: 'APPROVED' } } } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    const data = products.map((p) => this.mapProductListItem(p));
    return new PaginatedResult(data, total, page, limit);
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, status: ProductStatus.PUBLISHED, deletedAt: null },
      include: {
        category: { select: { id: true, slug: true, nameFr: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { orderBy: { price: 'asc' } },
        reviews: {
          where: { status: 'APPROVED' },
          include: { user: { select: { firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!product) throw new NotFoundException('Produit introuvable');
    return this.mapProductDetail(product);
  }

  async search(q: string, limit = 8) {
    if (!q?.trim()) return [];
    const products = await this.prisma.product.findMany({
      where: {
        status: ProductStatus.PUBLISHED,
        deletedAt: null,
        OR: [
          { nameFr: { contains: q, mode: 'insensitive' } },
          { nameEn: { contains: q, mode: 'insensitive' } },
          { shortDescFr: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: limit,
      include: {
        category: { select: { slug: true, nameFr: true } },
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
      },
    });
    return products.map((p) => this.mapProductListItem(p));
  }

  async findFeatured() {
    const [newProducts, bestsellers] = await Promise.all([
      this.prisma.product.findMany({
        where: { status: ProductStatus.PUBLISHED, isNew: true, deletedAt: null },
        take: 10,
        include: {
          category: { select: { id: true, slug: true, nameFr: true, nameEn: true } },
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        },
      }),
      this.prisma.product.findMany({
        where: { status: ProductStatus.PUBLISHED, isBestseller: true, deletedAt: null },
        take: 10,
        include: {
          category: { select: { id: true, slug: true, nameFr: true, nameEn: true } },
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        },
      }),
    ]);

    return {
      newProducts: newProducts.map((p) => this.mapProductListItem(p, 'en')),
      bestsellers: bestsellers.map((p) => this.mapProductListItem(p, 'en')),
    };
  }

  private mapProductListItem(product: Record<string, unknown>, locale: 'fr' | 'en' = 'fr') {
    const p = product as {
      id: string;
      slug: string;
      nameFr: string;
      nameEn: string | null;
      shortDescFr: string | null;
      descriptionEn: string | null;
      basePrice: number;
      compareAtPrice: number | null;
      status: string;
      isNew: boolean;
      isBestseller: boolean;
      category: { id: string; slug: string; nameFr: string; nameEn: string | null };
      images: { url: string; alt: string | null; colorHex?: string | null; colorName?: string | null }[];
    };

    const categoryNameFr = p.category.nameFr;
    const categoryNameEn = p.category.nameEn ?? categoryNameFr;
    const nameFr = p.nameFr;
    const nameEn = p.nameEn ?? nameFr;

    const shortDescriptionFr = p.shortDescFr;
    const shortDescriptionEn =
      p.descriptionEn?.replace(/\s+/g, ' ').trim().slice(0, 140) ??
      `${nameEn} · premium ${categoryNameEn.toLowerCase()} for visible radiance.`;

    return {
      id: p.id,
      slug: p.slug,
      name: locale === 'en' ? nameEn : nameFr,
      shortDescription: locale === 'en' ? shortDescriptionEn : shortDescriptionFr,
      price: p.basePrice,
      compareAtPrice: p.compareAtPrice,
      status: p.status,
      isNew: p.isNew,
      isBestseller: p.isBestseller,
      category: {
        id: p.category.id,
        slug: p.category.slug,
        name: locale === 'en' ? categoryNameEn : categoryNameFr,
      },
      images: p.images.map((i) => ({
        url: i.url,
        alt: i.alt ?? undefined,
        colorHex: i.colorHex ?? undefined,
        colorName: i.colorName ?? undefined,
      })),
    };
  }

  private mapProductDetail(product: Record<string, unknown>) {
    const base = this.mapProductListItem(product);
    const p = product as {
      descriptionFr: string | null;
      ingredients: string | null;
      usage: string | null;
      precautions: string | null;
      seoTitle: string | null;
      seoDescription: string | null;
      variants: {
        id: string;
        sku: string;
        name: string;
        price: number;
        compareAtPrice: number | null;
        stock: number;
        attributes: Record<string, string>;
      }[];
      reviews: {
        id: string;
        rating: number;
        title: string | null;
        comment: string | null;
        createdAt: Date;
        user: { firstName: string | null; lastName: string | null };
      }[];
    };

    return {
      ...base,
      description: p.descriptionFr ?? '',
      ingredients: p.ingredients,
      usage: p.usage,
      precautions: p.precautions,
      seoTitle: p.seoTitle,
      seoDescription: p.seoDescription,
      variants: p.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        name: v.name,
        price: v.price,
        compareAtPrice: v.compareAtPrice,
        stock: v.stock,
        attributes: v.attributes,
      })),
      reviews: p.reviews,
    };
  }
}
