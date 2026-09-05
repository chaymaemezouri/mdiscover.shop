import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    await this.verifyRecaptcha(dto.recaptchaToken);

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email déjà utilisé');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
      },
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });

    const tokens = await this.generateTokens(user.id, 'user');
    return { user, ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user?.passwordHash) throw new UnauthorizedException('Identifiants invalides');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Identifiants invalides');
    if (user.status === 'BLOCKED') throw new UnauthorizedException('Compte bloqué');

    const tokens = await this.generateTokens(user.id, 'user');
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      ...tokens,
    };
  }

  async adminLogin(dto: LoginDto & { totp?: string }) {
    const admin = await this.prisma.adminUser.findUnique({ where: { email: dto.email } });
    if (!admin) throw new UnauthorizedException('Identifiants invalides');

    const valid = await bcrypt.compare(dto.password, admin.passwordHash);
    if (!valid) throw new UnauthorizedException('Identifiants invalides');

    if (admin.twoFactorEnabled && admin.twoFactorSecret) {
      if (!dto.totp) {
        throw new BadRequestException({ message: '2FA requis', code: 'TOTP_REQUIRED' });
      }
      const { verifySync } = await import('otplib');
      const result = verifySync({ token: dto.totp, secret: admin.twoFactorSecret });
      if (!result.valid) throw new UnauthorizedException('Code 2FA invalide');
    }

    await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(admin.id, 'admin');
    return {
      admin: {
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string, type: 'user' | 'admin' = 'user') {
    if (type === 'admin') {
      const stored = await this.prisma.adminRefreshToken.findUnique({
        where: { token: refreshToken },
        include: { adminUser: true },
      });
      if (!stored || stored.expiresAt < new Date()) {
        throw new UnauthorizedException('Refresh token invalide');
      }
      await this.prisma.adminRefreshToken.delete({ where: { id: stored.id } });
      return this.generateTokens(stored.adminUserId, 'admin');
    }

    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token invalide');
    }
    await this.prisma.refreshToken.delete({ where: { id: stored.id } });
    return this.generateTokens(stored.userId, 'user');
  }

  private async generateTokens(subjectId: string, type: 'user' | 'admin') {
    const payload = type === 'admin' ? { sub: subjectId, type: 'admin' } : { sub: subjectId, type: 'user' };
    const accessToken = this.jwt.sign(payload);
    const refreshToken = uuidv4();
    const expiresIn = this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
    const days = parseInt(expiresIn.replace('d', ''), 10) || 7;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    if (type === 'admin') {
      await this.prisma.adminRefreshToken.create({
        data: { token: refreshToken, adminUserId: subjectId, expiresAt },
      });
    } else {
      await this.prisma.refreshToken.create({
        data: { token: refreshToken, userId: subjectId, expiresAt },
      });
    }

    return { accessToken, refreshToken };
  }

  async googleLogin(idToken: string) {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    if (!clientId) throw new UnauthorizedException('Google OAuth non configuré');

    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    if (!res.ok) throw new UnauthorizedException('Token Google invalide');

    const payload = (await res.json()) as {
      aud: string;
      sub: string;
      email: string;
      given_name?: string;
      family_name?: string;
      email_verified?: string;
    };

    if (payload.aud !== clientId) throw new UnauthorizedException('Token Google invalide');

    let user = await this.prisma.user.findFirst({
      where: { OR: [{ googleId: payload.sub }, { email: payload.email }] },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: payload.email,
          googleId: payload.sub,
          firstName: payload.given_name,
          lastName: payload.family_name,
          emailVerified: payload.email_verified === 'true',
        },
      });
    } else if (!user.googleId) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { googleId: payload.sub, emailVerified: true },
      });
    }

    if (user.status === 'BLOCKED') throw new UnauthorizedException('Compte bloqué');

    const tokens = await this.generateTokens(user.id, 'user');
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      ...tokens,
    };
  }

  private async verifyRecaptcha(token?: string) {
    const secret = this.config.get<string>('RECAPTCHA_SECRET_KEY');
    if (!secret) return;
    if (!token) throw new UnauthorizedException('reCAPTCHA requis');

    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`,
    });
    const data = (await res.json()) as { success?: boolean };
    if (!data.success) throw new UnauthorizedException('reCAPTCHA invalide');
  }
}
