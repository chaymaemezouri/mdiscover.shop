import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateReviewDto) {
    const existing = await this.prisma.review.findUnique({
      where: { productId_userId: { productId: dto.productId, userId } },
    });
    if (existing) throw new ConflictException('Vous avez déjà laissé un avis');

    if (dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestException('Note entre 1 et 5');
    }

    return this.prisma.review.create({
      data: { userId, productId: dto.productId, rating: dto.rating, title: dto.title, comment: dto.comment },
    });
  }

  async findByProduct(productId: string) {
    return this.prisma.review.findMany({
      where: { productId, status: 'APPROVED' },
      include: { user: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPending() {
    return this.prisma.review.findMany({
      where: { status: 'PENDING' },
      include: { product: { select: { nameFr: true, slug: true } }, user: { select: { email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async moderate(id: string, status: 'APPROVED' | 'REJECTED') {
    return this.prisma.review.update({ where: { id }, data: { status } });
  }
}
