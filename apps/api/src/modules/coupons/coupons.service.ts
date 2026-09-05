import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  async validate(code: string, subtotal: number) {
    const coupon = await this.prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon || !coupon.isActive) throw new BadRequestException('Code promo invalide');

    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) throw new BadRequestException('Code pas encore actif');
    if (coupon.expiresAt && coupon.expiresAt < now) throw new BadRequestException('Code expiré');
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) throw new BadRequestException('Code épuisé');
    if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
      throw new BadRequestException(`Montant minimum: ${coupon.minOrderAmount / 100} MAD`);
    }

    let discount = 0;
    switch (coupon.type) {
      case 'PERCENTAGE':
        discount = Math.round(subtotal * (coupon.value / 100));
        break;
      case 'FIXED':
        discount = coupon.value;
        break;
      case 'FREE_SHIPPING':
        discount = 0;
        break;
    }

    return { code: coupon.code, type: coupon.type, discount, freeShipping: coupon.type === 'FREE_SHIPPING' };
  }
}
