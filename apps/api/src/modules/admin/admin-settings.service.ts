import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export const DEFAULT_SETTINGS = {
  general: {
    siteName: 'mDISCOVER',
    contactEmail: 'contact@mdiscover.ma',
    phone: '+212 661-528608',
    whatsapp: '+212661528608',
    address: 'Maroc',
    city: '',
    country: 'Maroc',
    instagram: '',
    facebook: '',
    youtube: '',
    tiktok: '',
  },
  shipping: {
    freeShippingThreshold: 50000,
    bannerMessage: 'Paiement sécurisé · Paiement à la livraison',
    estimatedDays: '2-5 jours',
    codEnabled: true,
  },
  store: {
    maintenanceMode: false,
    allowGuestCheckout: true,
    currency: 'MAD',
    lowStockThreshold: 5,
    orderNotifyEmail: '',
    showPricesWithTax: true,
  },
  seo: {
    defaultTitle: 'mDISCOVER — Skincare & Beauté',
    defaultDescription: 'Soins de la peau et beauté premium au Maroc.',
    ogImageUrl: '',
  },
};

export type SiteSettings = typeof DEFAULT_SETTINGS;
export type SettingsSection = keyof SiteSettings;

@Injectable()
export class AdminSettingsService {
  constructor(private prisma: PrismaService) {}

  async getAll(): Promise<SiteSettings> {
    const rows = await this.prisma.siteSetting.findMany();
    const settings: SiteSettings = structuredClone(DEFAULT_SETTINGS);
    for (const row of rows) {
      const key = row.key as SettingsSection;
      if (key in settings) {
        settings[key] = {
          ...settings[key],
          ...(row.value as object),
        } as never;
      }
    }
    return settings;
  }

  async update(data: Partial<SiteSettings>) {
    const current = await this.getAll();
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined || !(key in DEFAULT_SETTINGS)) continue;
      const section = key as SettingsSection;
      const merged = { ...current[section], ...(value as object) };
      await this.prisma.siteSetting.upsert({
        where: { key },
        create: { key, value: merged },
        update: { value: merged },
      });
    }
    return this.getAll();
  }

  async getPublic() {
    const all = await this.getAll();
    return {
      shipping: {
        freeShippingThreshold: all.shipping.freeShippingThreshold,
        bannerMessage: all.shipping.bannerMessage,
        estimatedDays: all.shipping.estimatedDays,
        codEnabled: all.shipping.codEnabled,
      },
      store: {
        maintenanceMode: all.store.maintenanceMode,
        allowGuestCheckout: all.store.allowGuestCheckout,
        currency: all.store.currency,
        showPricesWithTax: all.store.showPricesWithTax,
      },
      general: {
        siteName: all.general.siteName,
        contactEmail: all.general.contactEmail,
        phone: all.general.phone,
        whatsapp: all.general.whatsapp,
        address: all.general.address,
        city: all.general.city,
        country: all.general.country,
        instagram: all.general.instagram,
        facebook: all.general.facebook,
        youtube: all.general.youtube,
        tiktok: all.general.tiktok,
      },
      seo: all.seo,
    };
  }

  async seedDefaults() {
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      await this.prisma.siteSetting.upsert({
        where: { key },
        create: { key, value },
        update: {},
      });
    }
  }
}
