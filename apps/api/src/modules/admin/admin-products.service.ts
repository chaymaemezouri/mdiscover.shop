import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/admin.dto';
import { parseCsv, rowsToCsv, PRODUCT_CSV_HEADERS } from './csv.util';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

@Injectable()
export class AdminProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20, search?: string, status?: string, categoryId?: string) {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (pageNum - 1) * limitNum;
    const term = typeof search === 'string' ? search.trim() : '';
    const where: Record<string, unknown> = { deletedAt: null };
    if (term) where.nameFr = { contains: term, mode: 'insensitive' as const };
    if (status) where.status = status as ProductStatus;
    if (categoryId) where.categoryId = categoryId;

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limitNum,
        include: { category: true, brand: true, variants: true, images: { orderBy: { sortOrder: 'asc' } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);
    return {
      data,
      meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: { category: true, brand: true, variants: true, images: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!product) throw new NotFoundException('Produit introuvable');
    return product;
  }

  async create(dto: CreateProductDto) {
    const slug = dto.slug ?? slugify(dto.nameFr);
    const existing = await this.prisma.product.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('Ce slug existe déjà');

    const variants = dto.variants?.length
      ? dto.variants
      : [{ sku: `SKU-${slug}`, name: 'Standard', price: dto.basePrice, stock: 0, isDefault: true }];

    return this.prisma.product.create({
      data: {
        slug,
        nameFr: dto.nameFr,
        nameAr: dto.nameAr,
        nameEn: dto.nameEn,
        shortDescFr: dto.shortDescFr,
        descriptionFr: dto.descriptionFr,
        ingredients: dto.ingredients,
        usage: dto.usage,
        basePrice: dto.basePrice,
        compareAtPrice: dto.compareAtPrice,
        categoryId: dto.categoryId,
        brandId: dto.brandId || null,
        status: dto.status ?? ProductStatus.DRAFT,
        isNew: dto.isNew ?? false,
        isBestseller: dto.isBestseller ?? false,
        isPromo: dto.isPromo ?? false,
        hasShippingFee: dto.hasShippingFee ?? true,
        skinTypes: dto.skinTypes ?? [],
        seoTitle: dto.seoTitle,
        seoDescription: dto.seoDescription,
        precautions: dto.precautions,
        variants: {
          create: variants.map((v, i) => ({
            sku: v.sku,
            name: v.name,
            price: v.price,
            compareAtPrice: v.compareAtPrice,
            stock: v.stock,
            isDefault: v.isDefault ?? i === 0,
            attributes: { volume: v.name },
          })),
        },
        images: (() => {
          type ImgIn = { url: string; alt?: string; colorHex?: string; colorName?: string };
          const imgs: ImgIn[] = dto.images?.length
            ? dto.images.map((img) => ({
                url: img.url,
                alt: img.alt,
                colorHex: img.colorHex,
                colorName: img.colorName,
              }))
            : (dto.imageUrls ?? []).map((url) => ({ url }));
          if (!imgs.length) return undefined;
          return {
            create: imgs.map((img, i) => ({
              url: img.url,
              alt: img.alt,
              colorHex: img.colorHex,
              colorName: img.colorName,
              isPrimary: i === 0,
              sortOrder: i,
            })),
          };
        })(),
      },
      include: { category: true, brand: true, variants: true, images: true },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);

    if (dto.slug) {
      const conflict = await this.prisma.product.findFirst({
        where: { slug: dto.slug, id: { not: id } },
      });
      if (conflict) throw new ConflictException('Ce slug existe déjà');
    }

    const { variants, imageUrls, images, brandId, ...data } = dto;

    await this.prisma.product.update({
      where: { id },
      data: {
        ...data,
        ...(brandId !== undefined ? { brandId: brandId || null } : {}),
      },
    });

    if (variants?.length) {
      await this.prisma.productVariant.deleteMany({ where: { productId: id } });
      await this.prisma.productVariant.createMany({
        data: variants.map((v, i) => ({
          productId: id,
          sku: v.sku,
          name: v.name,
          price: v.price,
          compareAtPrice: v.compareAtPrice,
          stock: v.stock,
          isDefault: v.isDefault ?? i === 0,
          attributes: { volume: v.name },
        })),
      });
    }

    if (images !== undefined || imageUrls !== undefined) {
      type ImgIn = { url: string; alt?: string; colorHex?: string; colorName?: string };
      const imgs: ImgIn[] = images?.length
        ? images.map((img) => ({
            url: img.url,
            alt: img.alt,
            colorHex: img.colorHex,
            colorName: img.colorName,
          }))
        : (imageUrls ?? []).map((url) => ({ url }));
      await this.prisma.productImage.deleteMany({ where: { productId: id } });
      if (imgs.length) {
        await this.prisma.productImage.createMany({
          data: imgs.map((img, i) => ({
            productId: id,
            url: img.url,
            alt: img.alt,
            colorHex: img.colorHex,
            colorName: img.colorName,
            isPrimary: i === 0,
            sortOrder: i,
          })),
        });
      }
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), status: ProductStatus.ARCHIVED },
    });
  }

  async duplicate(id: string) {
    const original = await this.findOne(id);
    const newSlug = `${original.slug}-copie-${Date.now().toString(36)}`;

    return this.prisma.product.create({
      data: {
        slug: newSlug,
        nameFr: `${original.nameFr} (copie)`,
        nameAr: original.nameAr,
        nameEn: original.nameEn,
        shortDescFr: original.shortDescFr,
        descriptionFr: original.descriptionFr,
        ingredients: original.ingredients,
        usage: original.usage,
        basePrice: original.basePrice,
        compareAtPrice: original.compareAtPrice,
        categoryId: original.categoryId,
        status: ProductStatus.DRAFT,
        isNew: original.isNew,
        isBestseller: original.isBestseller,
        skinTypes: original.skinTypes,
        seoTitle: original.seoTitle,
        seoDescription: original.seoDescription,
        variants: {
          create: original.variants.map((v) => ({
            sku: `${v.sku}-COPY`,
            name: v.name,
            price: v.price,
            compareAtPrice: v.compareAtPrice,
            stock: 0,
            isDefault: v.isDefault,
            attributes: v.attributes as object,
          })),
        },
        images: {
          create: original.images.map((img) => ({
            url: img.url,
            alt: img.alt,
            colorHex: img.colorHex,
            colorName: img.colorName,
            isPrimary: img.isPrimary,
            sortOrder: img.sortOrder,
          })),
        },
      },
      include: { category: true, brand: true, variants: true, images: true },
    });
  }

  async exportCsv(): Promise<string> {
    const products = await this.prisma.product.findMany({
      where: { deletedAt: null },
      include: { category: true, variants: true },
      orderBy: { slug: 'asc' },
    });

    const rows = products.flatMap((p) =>
      p.variants.length > 0
        ? p.variants.map((v) => [
            p.slug,
            p.nameFr,
            p.category.slug,
            p.basePrice,
            p.compareAtPrice ?? '',
            p.status,
            p.isNew,
            p.isBestseller,
            v.sku,
            v.name,
            v.price,
            v.stock,
          ])
        : [[p.slug, p.nameFr, p.category.slug, p.basePrice, p.compareAtPrice ?? '', p.status, p.isNew, p.isBestseller, '', '', '', '']],
    );

    return rowsToCsv(PRODUCT_CSV_HEADERS, rows);
  }

  async importCsv(csvText: string) {
    const rows = parseCsv(csvText);
    if (rows.length < 2) throw new ConflictException('CSV vide ou invalide');

    const headers = rows[0].map((h) => h.trim());
    const dataRows = rows.slice(1);
    const categories = await this.prisma.category.findMany();
    const catBySlug = new Map(categories.map((c) => [c.slug, c.id]));

    const grouped = new Map<string, string[][]>();
    for (const row of dataRows) {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = row[i]?.trim() ?? '';
      });
      const slug = obj.slug;
      if (!slug) continue;
      if (!grouped.has(slug)) grouped.set(slug, []);
      grouped.get(slug)!.push(row);
    }

    let created = 0;
    let updated = 0;

    for (const [slug, variantRows] of grouped) {
      const toObj = (row: string[]) => {
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => {
          obj[h] = row[i]?.trim() ?? '';
        });
        return obj;
      };

      const firstObj = toObj(variantRows[0]);
      const categoryId = catBySlug.get(firstObj.categorySlug);
      if (!categoryId) continue;

      const variants = variantRows
        .map((row) => {
          const obj = toObj(row);
          if (!obj.sku) return null;
          return {
            sku: obj.sku,
            name: obj.variantName || 'Standard',
            price: Number(obj.variantPrice) || Number(firstObj.basePrice) || 0,
            stock: Number(obj.variantStock) || 0,
            isDefault: false,
          };
        })
        .filter(Boolean) as { sku: string; name: string; price: number; stock: number; isDefault: boolean }[];

      if (variants.length === 0) {
        variants.push({
          sku: `SKU-${slug}`,
          name: 'Standard',
          price: Number(firstObj.basePrice) || 0,
          stock: 0,
          isDefault: true,
        });
      } else {
        variants[0].isDefault = true;
      }

      const parseBool = (v: string) => v === 'true' || v === '1';
      const existing = await this.prisma.product.findUnique({ where: { slug } });
      const productData = {
        nameFr: firstObj.nameFr,
        basePrice: Number(firstObj.basePrice) || 0,
        compareAtPrice: firstObj.compareAtPrice ? Number(firstObj.compareAtPrice) : null,
        status: (firstObj.status as ProductStatus) || ProductStatus.DRAFT,
        isNew: parseBool(firstObj.isNew),
        isBestseller: parseBool(firstObj.isBestseller),
        categoryId,
      };

      if (existing) {
        await this.prisma.product.update({ where: { id: existing.id }, data: productData });
        await this.prisma.productVariant.deleteMany({ where: { productId: existing.id } });
        await this.prisma.productVariant.createMany({
          data: variants.map((v, i) => ({
            productId: existing.id,
            sku: v.sku,
            name: v.name,
            price: v.price,
            stock: v.stock,
            isDefault: i === 0,
            attributes: { volume: v.name },
          })),
        });
        updated++;
      } else {
        await this.prisma.product.create({
          data: {
            slug,
            ...productData,
            variants: {
              create: variants.map((v, i) => ({
                sku: v.sku,
                name: v.name,
                price: v.price,
                stock: v.stock,
                isDefault: i === 0,
                attributes: { volume: v.name },
              })),
            },
          },
        });
        created++;
      }
    }

    return { created, updated, total: created + updated };
  }
}
