import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { CouponType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminCouponsService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string, isActive?: string, type?: string) {
    const where: Prisma.CouponWhereInput = {};
    if (search?.trim()) {
      where.code = { contains: search.trim(), mode: 'insensitive' };
    }
    if (isActive === 'true') where.isActive = true;
    if (isActive === 'false') where.isActive = false;
    if (type && ['PERCENTAGE', 'FIXED', 'FREE_SHIPPING'].includes(type)) {
      where.type = type as CouponType;
    }

    const [data, total, activeCount, inactiveCount] = await Promise.all([
      this.prisma.coupon.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { orders: true } } },
      }),
      this.prisma.coupon.count({ where }),
      this.prisma.coupon.count({ where: { isActive: true } }),
      this.prisma.coupon.count({ where: { isActive: false } }),
    ]);

    return {
      data: data.map((c) => ({
        ...c,
        orderCount: c._count.orders,
      })),
      meta: {
        total,
        counts: { ACTIVE: activeCount, INACTIVE: inactiveCount },
      },
    };
  }

  async findOne(id: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
      include: {
        _count: { select: { orders: true } },
        orders: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            orderNumber: true,
            total: true,
            status: true,
            discount: true,
            createdAt: true,
            guestEmail: true,
            user: { select: { email: true, firstName: true, lastName: true } },
          },
        },
      },
    });
    if (!coupon) throw new NotFoundException('Coupon introuvable');

    let categories: { id: string; nameFr: string; slug: string }[] = [];
    if (coupon.categoryIds.length > 0) {
      categories = await this.prisma.category.findMany({
        where: { id: { in: coupon.categoryIds } },
        select: { id: true, nameFr: true, slug: true },
      });
    }

    return {
      ...coupon,
      orderCount: coupon._count.orders,
      categories,
    };
  }

  async create(data: {
    code: string;
    type: CouponType;
    value: number;
    minOrderAmount?: number;
    maxUses?: number;
    startsAt?: string;
    expiresAt?: string;
    categoryIds?: string[];
    productIds?: string[];
    isActive?: boolean;
  }) {
    const code = data.code.toUpperCase().trim();
    if (!code) throw new ConflictException('Code requis');
    const existing = await this.prisma.coupon.findUnique({ where: { code } });
    if (existing) throw new ConflictException('Code déjà existant');

    return this.prisma.coupon.create({
      data: {
        code,
        type: data.type,
        value: data.value,
        minOrderAmount: data.minOrderAmount,
        maxUses: data.maxUses,
        startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        categoryIds: data.categoryIds ?? [],
        productIds: data.productIds ?? [],
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(
    id: string,
    data: {
      code?: string;
      type?: CouponType;
      value?: number;
      minOrderAmount?: number | null;
      maxUses?: number | null;
      startsAt?: string | null;
      expiresAt?: string | null;
      categoryIds?: string[];
      productIds?: string[];
      isActive?: boolean;
    },
  ) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon introuvable');

    if (data.code) {
      const code = data.code.toUpperCase().trim();
      if (code !== coupon.code) {
        const existing = await this.prisma.coupon.findUnique({ where: { code } });
        if (existing) throw new ConflictException('Code déjà existant');
      }
      data.code = code;
    }

    return this.prisma.coupon.update({
      where: { id },
      data: {
        code: data.code,
        type: data.type,
        value: data.value,
        minOrderAmount: data.minOrderAmount === undefined ? undefined : data.minOrderAmount,
        maxUses: data.maxUses === undefined ? undefined : data.maxUses,
        startsAt:
          data.startsAt === undefined
            ? undefined
            : data.startsAt
              ? new Date(data.startsAt)
              : null,
        expiresAt:
          data.expiresAt === undefined
            ? undefined
            : data.expiresAt
              ? new Date(data.expiresAt)
              : null,
        categoryIds: data.categoryIds,
        productIds: data.productIds,
        isActive: data.isActive,
      },
    });
  }

  async toggle(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon introuvable');
    return this.prisma.coupon.update({
      where: { id },
      data: { isActive: !coupon.isActive },
    });
  }

  async remove(id: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
      include: { _count: { select: { orders: true } } },
    });
    if (!coupon) throw new NotFoundException('Coupon introuvable');
    if (coupon._count.orders > 0) {
      throw new ConflictException(
        'Ce coupon a déjà été utilisé — désactive-le plutôt que de le supprimer',
      );
    }
    return this.prisma.coupon.delete({ where: { id } });
  }
}
