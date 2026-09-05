export type Settings = {
  general: {
    siteName: string;
    contactEmail: string;
    phone: string;
    whatsapp: string;
    address: string;
    city: string;
    country: string;
    instagram: string;
    facebook: string;
    youtube: string;
    tiktok: string;
  };
  shipping: {
    freeShippingThreshold: number;
    bannerMessage: string;
    estimatedDays: string;
    codEnabled: boolean;
  };
  store: {
    maintenanceMode: boolean;
    allowGuestCheckout: boolean;
    currency: string;
    lowStockThreshold: number;
    orderNotifyEmail: string;
    showPricesWithTax: boolean;
  };
  seo: {
    defaultTitle: string;
    defaultDescription: string;
    ogImageUrl: string;
  };
};

export type SettingsSection = keyof Settings;
