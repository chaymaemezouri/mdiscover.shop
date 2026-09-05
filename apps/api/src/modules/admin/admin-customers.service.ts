import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminCustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20, search?: string, status?: string) {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.UserWhereInput = {
      role: 'CUSTOMER',
      deletedAt: null,
    };

    if (status && ['ACTIVE', 'BLOCKED', 'DELETED'].includes(status)) {
      where.status = status as UserStatus;
    }

    if (search?.trim()) {
      const q = search.trim();
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [data, total, statusGroups] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          status: true,
          locale: true,
          emailVerified: true,
          createdAt: true,
          _count: { select: { orders: true, addresses: true, wishlist: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
      this.prisma.user.groupBy({
        by: ['status'],
        where: { role: 'CUSTOMER', deletedAt: null },
        _count: { _all: true },
      }),
    ]);

    const userIds = data.map((u) => u.id);
    const revenues =
      userIds.length === 0
        ? []
        : await this.prisma.order.groupBy({
            by: ['userId'],
            where: {
              userId: { in: userIds },
              status: { notIn: ['CANCELLED'] },
            },
            _sum: { total: true },
            _count: { _all: true },
          });

    const revenueByUser = new Map(
      revenues.map((r) => [
        r.userId!,
        { totalSpent: r._sum.total ?? 0, paidOrders: r._count._all },
      ]),
    );

    const enriched = data.map((user) => {
      const stats = revenueByUser.get(user.id) ?? { totalSpent: 0, paidOrders: 0 };
      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        status: user.status,
        locale: user.locale,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        orderCount: user._count.orders,
        addressCount: user._count.addresses,
        wishlistCount: user._count.wishlist,
        totalSpent: stats.totalSpent,
      };
    });

    const counts = Object.fromEntries(
      statusGroups.map((g) => [g.status, g._count._all]),
    ) as Record<string, number>;

    return {
      data: enriched,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        counts,
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        addresses: { orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] },
        orders: {
          take: 30,
          orderBy: { createdAt: 'desc' },
          include: {
            payment: true,
            items: { take: 3 },
            _count: { select: { items: true } },
          },
        },
        wishlist: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            product: {
              select: {
                id: true,
                slug: true,
                nameFr: true,
                nameEn: true,
                basePrice: true,
                status: true,
                images: { take: 1, orderBy: { sortOrder: 'asc' }, select: { url: true } },
              },
            },
          },
        },
        _count: {
          select: { orders: true, addresses: true, wishlist: true, reviews: true },
        },
      },
    });

    if (!user || user.role !== 'CUSTOMER') {
      throw new NotFoundException('Client introuvable');
    }

    const [revenue, lastOrder] = await Promise.all([
      this.prisma.order.aggregate({
        where: { userId: id, status: { notIn: ['CANCELLED'] } },
        _sum: { total: true },
        _count: { _all: true },
      }),
      this.prisma.order.findFirst({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true, orderNumber: true },
      }),
    ]);

    const { passwordHash: _, ...safe } = user as typeof user & { passwordHash?: string };

    return {
      ...safe,
      orderCount: user._count.orders,
      addressCount: user._count.addresses,
      wishlistCount: user._count.wishlist,
      reviewCount: user._count.reviews,
      totalSpent: revenue._sum.total ?? 0,
      completedOrders: revenue._count._all,
      lastOrderAt: lastOrder?.createdAt ?? null,
      lastOrderNumber: lastOrder?.orderNumber ?? null,
    };
  }

  async block(id: string) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { status: 'BLOCKED' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
      },
    });
  }

  async unblock(id: string) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { status: 'ACTIVE' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
      },
    });
  }
}
