import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DEFAULT_SETTINGS } from '../admin/admin-settings.service';

@Injectable()
export class CmsService {
  constructor(private prisma: PrismaService) {}

  async getBanners() {
    return this.prisma.homeBanner.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getPage(slug: string) {
    const page = await this.prisma.page.findFirst({
      where: { slug, isPublished: true },
    });
    if (!page) throw new NotFoundException('Page introuvable');
    return page;
  }

  async getBlogPosts(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [posts, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        where: { isPublished: true },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.blogPost.count({ where: { isPublished: true } }),
    ]);
    return { data: posts, meta: { total, page, limit } };
  }

  async getBlogPost(slug: string) {
    const post = await this.prisma.blogPost.findFirst({
      where: { slug, isPublished: true },
    });
    if (!post) throw new NotFoundException('Article introuvable');
    return post;
  }

  async getPublicSettings() {
    const rows = await this.prisma.siteSetting.findMany();
    const settings = structuredClone(DEFAULT_SETTINGS);
    for (const row of rows) {
      const key = row.key as keyof typeof DEFAULT_SETTINGS;
      if (key in settings) {
        (settings as Record<string, object>)[key] = {
          ...settings[key],
          ...(row.value as object),
        };
      }
    }
    return {
      shipping: {
        freeShippingThreshold: settings.shipping.freeShippingThreshold,
        bannerMessage: settings.shipping.bannerMessage,
        estimatedDays: settings.shipping.estimatedDays,
        codEnabled: settings.shipping.codEnabled,
      },
      store: {
        maintenanceMode: settings.store.maintenanceMode,
        allowGuestCheckout: settings.store.allowGuestCheckout,
        currency: settings.store.currency,
        showPricesWithTax: settings.store.showPricesWithTax,
      },
      general: {
        siteName: settings.general.siteName,
        contactEmail: settings.general.contactEmail,
        phone: settings.general.phone,
        whatsapp: settings.general.whatsapp,
        address: settings.general.address,
        city: settings.general.city,
        country: settings.general.country,
        instagram: settings.general.instagram,
        facebook: settings.general.facebook,
        youtube: settings.general.youtube,
        tiktok: settings.general.tiktok,
      },
      seo: settings.seo,
    };
  }
}
