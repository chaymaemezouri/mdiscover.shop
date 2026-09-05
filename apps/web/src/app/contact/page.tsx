import type { Metadata } from 'next';
import { ContactPageContent } from '@/components/contact/ContactPageContent';
import { APP_NAME } from '@mdiscovershop/shared';

export const metadata: Metadata = {
  title: `Contact | ${APP_NAME}`,
  description: 'Contact mDISCOVER — questions about products, orders, and beauty advice.',
};

export default function ContactPage() {
  return <ContactPageContent />;
}
