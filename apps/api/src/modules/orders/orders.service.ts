import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private email: EmailService,
  ) {}

  async create(dto: CreateOrderDto, userId?: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { id: dto.cartId },
      include: {
        items: {
          include: { product: true, variant: true },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Panier vide ou introuvable');
    }

    let resolvedUserId = userId;
    if (!resolvedUserId && dto.guestEmail) {
      const byEmail = await this.prisma.user.findFirst({
        where: { email: { equals: dto.guestEmail, mode: 'insensitive' } },
        select: { id: true },
      });
      resolvedUserId = byEmail?.id;
    }

    const subtotal = cart.items.reduce((sum, item) => {
      const price = item.variant?.price ?? item.product.basePrice;
      return sum + price * item.quantity;
    }, 0);

    const shippingCost = dto.shippingCost ?? 0;
    const discount = dto.discount ?? 0;
    const total = subtotal + shippingCost - discount;
    const orderNumber = `MDS-${Date.now().toString(36).toUpperCase()}`;

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          userId: resolvedUserId,
          guestEmail: dto.guestEmail,
          subtotal,
          shippingCost,
          discount,
          total,
          shippingAddress: dto.shippingAddress as object,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              name: item.product.nameFr,
              sku: item.variant?.sku ?? `SKU-${item.product.slug}`,
              quantity: item.quantity,
              unitPrice: item.variant?.price ?? item.product.basePrice,
              total: (item.variant?.price ?? item.product.basePrice) * item.quantity,
            })),
          },
          payment: {
            create: {
              method: dto.paymentMethod as PaymentMethod,
              status: dto.paymentMethod === 'COD' ? 'PENDING' : 'PENDING',
              amount: total,
            },
          },
          shipment: {
            create: { status: 'PENDING' },
          },
          statusHistory: {
            create: { status: 'PENDING', note: 'Commande créée' },
          },
        },
        include: { items: true, payment: true, shipment: true },
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      for (const item of cart.items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      return created;
    });

    const email =
      dto.guestEmail ??
      (resolvedUserId
        ? (await this.prisma.user.findUnique({ where: { id: resolvedUserId } }))?.email
        : undefined);

    if (email) {
      this.email.sendOrderConfirmation(email, order.orderNumber, order.total).catch(() => {});
    }

    return order;
  }

  async findByUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    return this.prisma.order.findMany({
      where: {
        OR: [
          { userId },
          ...(user?.email
            ? [{ guestEmail: { equals: user.email, mode: 'insensitive' as const } }]
            : []),
        ],
      },
      include: { payment: true, shipment: true, items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByOrderNumber(orderNumber: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: { payment: true, shipment: true, items: true, statusHistory: true },
    });
    if (!order) throw new NotFoundException('Commande introuvable');
    return order;
  }
}
