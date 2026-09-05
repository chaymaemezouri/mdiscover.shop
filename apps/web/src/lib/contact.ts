import {
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_E164,
  CONTACT_WHATSAPP_DIGITS,
} from '@mdiscovershop/shared';

const fromEnv = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, '') ?? '';

export const STORE_PHONE_DISPLAY = CONTACT_PHONE_DISPLAY;
export const STORE_PHONE_TEL = `tel:${CONTACT_PHONE_E164}`;
export const STORE_WHATSAPP_DIGITS = fromEnv || CONTACT_WHATSAPP_DIGITS;

export function storeWhatsAppUrl(prefill?: string) {
  const base = `https://wa.me/${STORE_WHATSAPP_DIGITS}`;
  if (!prefill) return base;
  return `${base}?text=${encodeURIComponent(prefill)}`;
}
