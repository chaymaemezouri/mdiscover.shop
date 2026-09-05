import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminContactService {
  constructor(private prisma: PrismaService) {}

  async list(status?: string, search?: string, page = 1, limit = 30) {
    const where: Record<string, unknown> = {};
    if (status === 'unread') where.isRead = false;
    if (status === 'read') where.isRead = true;
    if (search?.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { message: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [data, total, unreadCount] = await Promise.all([
      this.prisma.contactMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.contactMessage.count({ where }),
      this.prisma.contactMessage.count({ where: { isRead: false } }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        unreadCount,
      },
    };
  }

  async get(id: string) {
    const msg = await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!msg) throw new NotFoundException('Message introuvable');
    return msg;
  }

  async markRead(id: string, isRead = true) {
    await this.get(id);
    return this.prisma.contactMessage.update({
      where: { id },
      data: { isRead },
    });
  }

  async remove(id: string) {
    await this.get(id);
    await this.prisma.contactMessage.delete({ where: { id } });
    return { ok: true };
  }
}
