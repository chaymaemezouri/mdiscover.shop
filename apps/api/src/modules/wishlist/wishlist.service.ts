import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WishlistService {
  constructor(private prisma: PrismaService) {}

  async getItems(userId: string) {
    const items = await this.prisma.wishlistItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            images: { where: { isPrimary: true }, take: 1 },
            category: { select: { nameFr: true, slug: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return items.map((item) => ({
      id: item.id,
      productId: item.productId,
      product: {
        slug: item.product.slug,
        name: item.product.nameFr,
        price: item.product.basePrice,
        compareAtPrice: item.product.compareAtPrice,
        image: item.product.images[0]?.url,
        category: item.product.category.nameFr,
      },
    }));
  }

  async add(userId: string, productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Produit introuvable');

    const existing = await this.prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (existing) throw new ConflictException('Déjà dans la wishlist');

    return this.prisma.wishlistItem.create({ data: { userId, productId } });
  }

  async remove(userId: string, productId: string) {
    return this.prisma.wishlistItem.deleteMany({ where: { userId, productId } });
  }
}
