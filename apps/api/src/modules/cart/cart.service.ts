import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateCart(userId?: string, sessionId?: string) {
    if (userId) {
      let cart = await this.prisma.cart.findUnique({
        where: { userId },
        include: this.cartInclude(),
      });
      if (!cart) {
        cart = await this.prisma.cart.create({
          data: { userId },
          include: this.cartInclude(),
        });
      }
      return this.mapCart(cart);
    }

    if (!sessionId) throw new BadRequestException('Session ID requis');
    let cart = await this.prisma.cart.findUnique({
      where: { sessionId },
      include: this.cartInclude(),
    });
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { sessionId },
        include: this.cartInclude(),
      });
    }
    return this.mapCart(cart);
  }

  async addItem(cartId: string, dto: AddToCartDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: { variants: true },
    });
    if (!product) throw new NotFoundException('Produit introuvable');

    const variant = dto.variantId
      ? product.variants.find((v) => v.id === dto.variantId)
      : product.variants.find((v) => v.isDefault) ?? product.variants[0];

    if (variant && variant.stock < dto.quantity) {
      throw new BadRequestException('Stock insuffisant');
    }

    const existing = await this.prisma.cartItem.findFirst({
      where: { cartId, productId: dto.productId, variantId: variant?.id ?? null },
    });

    if (existing) {
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + dto.quantity },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId,
          productId: dto.productId,
          variantId: variant?.id,
          quantity: dto.quantity,
        },
      });
    }

    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
      include: this.cartInclude(),
    });
    return this.mapCart(cart!);
  }

  async updateItem(cartId: string, itemId: string, dto: UpdateCartItemDto) {
    const item = await this.prisma.cartItem.findFirst({ where: { id: itemId, cartId } });
    if (!item) throw new NotFoundException('Article introuvable');

    if (dto.quantity <= 0) {
      await this.prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      await this.prisma.cartItem.update({ where: { id: itemId }, data: { quantity: dto.quantity } });
    }

    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
      include: this.cartInclude(),
    });
    return this.mapCart(cart!);
  }

  async removeItem(cartId: string, itemId: string) {
    await this.prisma.cartItem.deleteMany({ where: { id: itemId, cartId } });
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
      include: this.cartInclude(),
    });
    return this.mapCart(cart!);
  }

  private cartInclude() {
    return {
      items: {
        include: {
          product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
          variant: true,
        },
      },
    } as const;
  }

  private mapCart(cart: {
    id: string;
    items: {
      id: string;
      productId: string;
      variantId: string | null;
      quantity: number;
      product: { nameFr: string; slug: string; basePrice: number; images: { url: string }[] };
      variant: { name: string; price: number } | null;
    }[];
  }) {
    const items = cart.items.map((item) => {
      const unitPrice = item.variant?.price ?? item.product.basePrice;
      return {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice,
        product: {
          name: item.product.nameFr,
          slug: item.product.slug,
          image: item.product.images[0]?.url,
        },
        variant: item.variant ? { name: item.variant.name } : undefined,
      };
    });

    const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    return { id: cart.id, items, subtotal, itemCount: items.reduce((s, i) => s + i.quantity, 0) };
  }
}
