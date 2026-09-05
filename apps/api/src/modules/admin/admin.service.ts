import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalOrders,
      ordersToday,
      ordersThisMonth,
      revenueThisMonth,
      lowStockVariants,
      pendingReviews,
      recentOrders,
    ] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
      this.prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
      this.prisma.order.aggregate({
        where: { createdAt: { gte: startOfMonth }, status: { not: 'CANCELLED' } },
        _sum: { total: true },
      }),
      this.prisma.productVariant.findMany({
        where: { stock: { lte: 5 } },
        include: { product: { select: { id: true, nameFr: true, slug: true } } },
        take: 10,
      }),
      this.prisma.review.count({ where: { status: 'PENDING' } }),
      this.prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { payment: true },
      }),
    ]);

    const avgOrderValue =
      ordersThisMonth > 0 ? Math.round((revenueThisMonth._sum.total ?? 0) / ordersThisMonth) : 0;

    return {
      orders: { total: totalOrders, today: ordersToday, thisMonth: ordersThisMonth },
      revenue: { thisMonth: revenueThisMonth._sum.total ?? 0, avgOrderValue },
      alerts: { lowStock: lowStockVariants, pendingReviews },
      recentOrders,
    };
  }

  async getAnalytics(daysInput = 30) {
    const days = Math.min(90, Math.max(7, Number(daysInput) || 30));
    const start = new Date();
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);

    const orders = await this.prisma.order.findMany({
      where: { createdAt: { gte: start } },
      select: { createdAt: true, total: true, status: true },
    });

    const revenueByDay: Record<string, number> = {};
    const ordersByDay: Record<string, number> = {};
    const ordersByStatus: Record<string, number> = {};

    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      revenueByDay[key] = 0;
      ordersByDay[key] = 0;
    }

    for (const order of orders) {
      const key = order.createdAt.toISOString().slice(0, 10);
      if (revenueByDay[key] !== undefined && order.status !== 'CANCELLED') {
        revenueByDay[key] += order.total;
      }
      if (ordersByDay[key] !== undefined) {
        ordersByDay[key] += 1;
      }
      ordersByStatus[order.status] = (ordersByStatus[order.status] ?? 0) + 1;
    }

    const dailyRevenue = Object.entries(revenueByDay).map(([date, revenue]) => ({
      date,
      revenue,
    }));
    const dailyOrders = Object.entries(ordersByDay).map(([date, count]) => ({
      date,
      count,
    }));
    const statusBreakdown = Object.entries(ordersByStatus).map(([status, count]) => ({
      status,
      count,
    }));

    const totalRevenue = orders
      .filter((o) => o.status !== 'CANCELLED')
      .reduce((s, o) => s + o.total, 0);

    return {
      period: { days, from: start.toISOString(), to: new Date().toISOString() },
      summary: { totalOrders: orders.length, totalRevenue },
      dailyRevenue,
      dailyOrders,
      statusBreakdown,
    };
  }

  async getProducts(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        skip,
        take: limit,
        include: {
          category: true,
          variants: true,
          images: { take: 1 },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count(),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getOrders(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where = status ? { status: status as never } : {};
    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: { payment: true, shipment: true, items: true, user: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async updateProfile(
    adminId: string,
    data: { email?: string; firstName?: string; lastName?: string },
  ) {
    const email = data.email?.trim().toLowerCase();
    const firstName = data.firstName?.trim();
    const lastName = data.lastName?.trim();

    if (email !== undefined && !email) {
      throw new BadRequestException('Email requis');
    }
    if (firstName !== undefined && !firstName) {
      throw new BadRequestException('Prénom requis');
    }
    if (lastName !== undefined && !lastName) {
      throw new BadRequestException('Nom requis');
    }

    if (email) {
      const existing = await this.prisma.adminUser.findFirst({
        where: { email, NOT: { id: adminId } },
      });
      if (existing) throw new ConflictException('Email déjà utilisé');
    }

    const admin = await this.prisma.adminUser.update({
      where: { id: adminId },
      data: {
        ...(email !== undefined && { email }),
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
      },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        twoFactorEnabled: true,
      },
    });
    return admin;
  }

  async changePassword(adminId: string, currentPassword: string, newPassword: string) {
    if (!currentPassword || !newPassword) {
      throw new BadRequestException('Mot de passe actuel et nouveau requis');
    }
    if (newPassword.length < 8) {
      throw new BadRequestException('Le nouveau mot de passe doit faire au moins 8 caractères');
    }

    const admin = await this.prisma.adminUser.findUnique({
      where: { id: adminId },
      select: { passwordHash: true },
    });
    if (!admin) throw new UnauthorizedException();

    const valid = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!valid) throw new UnauthorizedException('Mot de passe actuel incorrect');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.adminUser.update({
      where: { id: adminId },
      data: { passwordHash },
    });
    return { success: true };
  }
}
