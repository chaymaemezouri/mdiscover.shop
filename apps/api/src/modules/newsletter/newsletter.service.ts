import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscribeDto } from './dto/subscribe.dto';

@Injectable()
export class NewsletterService {
  constructor(private prisma: PrismaService) {}

  async subscribe(dto: SubscribeDto) {
    const existing = await this.prisma.newsletterSubscriber.findUnique({
      where: { email: dto.email },
    });
    if (existing?.isActive) throw new ConflictException('Email déjà inscrit');

    if (existing) {
      return this.prisma.newsletterSubscriber.update({
        where: { email: dto.email },
        data: { isActive: true, locale: dto.locale ?? 'FR' },
      });
    }

    return this.prisma.newsletterSubscriber.create({
      data: { email: dto.email, locale: dto.locale ?? 'FR' },
    });
  }
}
