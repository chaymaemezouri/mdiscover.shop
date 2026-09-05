import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { generateSecret, generateURI, verifySync } from 'otplib';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminTwoFactorService {
  constructor(private prisma: PrismaService) {}

  async setup(adminId: string) {
    const admin = await this.prisma.adminUser.findUnique({ where: { id: adminId } });
    if (!admin) throw new UnauthorizedException();

    const secret = generateSecret();
    await this.prisma.adminUser.update({
      where: { id: adminId },
      data: { twoFactorSecret: secret, twoFactorEnabled: false },
    });

    const otpauth = generateURI({
      issuer: 'mDISCOVER Admin',
      label: admin.email,
      secret,
    });
    return { secret, otpauth };
  }

  async enable(adminId: string, token: string) {
    const admin = await this.prisma.adminUser.findUnique({ where: { id: adminId } });
    if (!admin?.twoFactorSecret) throw new BadRequestException('2FA non initialisé');

    const result = verifySync({ token, secret: admin.twoFactorSecret });
    if (!result.valid) throw new BadRequestException('Code invalide');

    await this.prisma.adminUser.update({
      where: { id: adminId },
      data: { twoFactorEnabled: true },
    });
    return { enabled: true };
  }

  async disable(adminId: string, token: string) {
    await this.verifyToken(adminId, token);
    await this.prisma.adminUser.update({
      where: { id: adminId },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });
    return { enabled: false };
  }

  async verifyToken(adminId: string, token: string) {
    const admin = await this.prisma.adminUser.findUnique({ where: { id: adminId } });
    if (!admin?.twoFactorEnabled || !admin.twoFactorSecret) return true;

    const result = verifySync({ token, secret: admin.twoFactorSecret });
    if (!result.valid) throw new UnauthorizedException('Code 2FA invalide');
    return true;
  }
}
