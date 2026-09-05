import type { Metadata } from 'next';
import { DM_Serif_Display, Manrope } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CookieConsent } from '@/components/layout/CookieConsent';
import { AccountConnectModal } from '@/components/layout/AccountConnectModal';
import { AddToCartToast } from '@/components/cart/AddToCartToast';
import { GoogleAnalytics } from '@/components/layout/GoogleAnalytics';
import { MaintenanceGate } from '@/components/layout/MaintenanceGate';
import { LocaleInit } from '@/components/layout/LocaleInit';
import { APP_NAME } from '@mdiscovershop/shared';

const dmSerifDisplay = DM_Serif_Display({
  subsets: ['latin'],
  variable: '--font-dm-serif',
  weight: '400',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  weight: ['400', '500', '600'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — Luxury Skincare`,
    template: `%s | ${APP_NAME}`,
  },
  description:
    `${APP_NAME} — premium luxury skincare. Advanced formulas enriched with precious ingredients for radiant, timeless beauty.`,
  keywords: [APP_NAME, 'skincare', 'luxury', 'cosmetics', 'serum', 'Morocco'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body className={`${dmSerifDisplay.variable} ${manrope.variable} min-h-screen flex flex-col`}>
        <LocaleInit />
        <Header />
        <main className="flex-1">
          <MaintenanceGate>{children}</MaintenanceGate>
        </main>
        <Footer />
        <CookieConsent />
        <AccountConnectModal />
        <AddToCartToast />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
