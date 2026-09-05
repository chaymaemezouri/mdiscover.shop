import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AmanaService } from '../shipping/shipping.service';
import { buildInvoiceHtml } from './invoice.util';
import { UpdateOrderStatusDto } from './dto/admin.dto';

const VALID_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['REFUNDED'],
};

@Injectable()
export class AdminOrdersService {
  constructor(
    private prisma: PrismaService,
    private amana: AmanaService,
  ) {}

  async findAll(
    page = 1,
    limit = 20,
    status?: string,
    search?: string,
    paymentMethod?: string,
    paymentStatus?: string,
  ) {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.OrderWhereInput = {};
    if (status) where.status = status as OrderStatus;
    if (paymentMethod || paymentStatus) {
      where.payment = {};
      if (paymentMethod) where.payment.method = paymentMethod as never;
      if (paymentStatus) where.payment.status = paymentStatus as never;
    }
    if (search?.trim()) {
      const q = search.trim();
      where.OR = [
        { orderNumber: { contains: q, mode: 'insensitive' } },
        { guestEmail: { contains: q, mode: 'insensitive' } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
        { user: { firstName: { contains: q, mode: 'insensitive' } } },
        { user: { lastName: { contains: q, mode: 'insensitive' } } },
        { shipment: { trackingNumber: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [data, total, statusGroups] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          payment: true,
          shipment: true,
          items: true,
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
      this.prisma.order.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
    ]);

    const counts = Object.fromEntries(
      statusGroups.map((g) => [g.status, g._count._all]),
    ) as Record<string, number>;

    return {
      data,
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
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        payment: true,
        shipment: true,
        items: true,
        coupon: { select: { id: true, code: true, type: true, value: true } },
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, phone: true },
        },
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!order) throw new NotFoundException('Commande introuvable');
    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto, adminId?: string) {
    const order = await this.findOne(id);
    const newStatus = dto.status as OrderStatus;
    const allowed = VALID_TRANSITIONS[order.status];

    if (allowed && !allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Transition impossible: ${order.status} → ${newStatus}`,
      );
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id },
        data: { status: newStatus },
        include: {
          payment: true,
          shipment: true,
          items: true,
          user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
          statusHistory: { orderBy: { createdAt: 'desc' } },
        },
      }),
      this.prisma.orderStatusHistory.create({
        data: {
          orderId: id,
          status: newStatus,
          note: dto.note,
          createdBy: adminId,
        },
      }),
    ]);

    if (newStatus === 'SHIPPED') {
      try {
        await this.prisma.shipment.update({
          where: { orderId: id },
          data: { status: 'IN_TRANSIT' },
        });
      } catch {
        /* shipment may not exist yet */
      }
    }

    if (newStatus === 'PROCESSING' || newStatus === 'CONFIRMED') {
      await this.amana.createShipment(id).catch(() => {});
    }

    return this.findOne(id);
  }

  async updateNotes(id: string, notes: string | null) {
    await this.findOne(id);
    return this.prisma.order.update({
      where: { id },
      data: { notes: notes?.trim() || null },
      include: {
        payment: true,
        shipment: true,
        items: true,
        user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  getAllowedTransitions(status: OrderStatus) {
    return VALID_TRANSITIONS[status] ?? [];
  }

  async getInvoiceHtml(id: string) {
    const order = await this.findOne(id);
    return buildInvoiceHtml(order as Parameters<typeof buildInvoiceHtml>[0]);
  }
}
