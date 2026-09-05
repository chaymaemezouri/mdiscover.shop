'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { useLocale } from '@/i18n/store';
import type { Locale } from '@/i18n/translations';

type FaqItem = { q: string; a: string };
type FaqSection = { title: string; items: FaqItem[] };

const COPY: Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    subtitle: string;
    ctaTitle: string;
    ctaBody: string;
    ctaContact: string;
    sections: FaqSection[];
  }
> = {
  fr: {
    eyebrow: 'Aide',
    title: 'Questions fréquentes',
    subtitle:
      'Tout ce qu’il faut savoir pour commander vos soins mDISCOVER en toute sérénité — livraison, paiement et retours au Maroc.',
    ctaTitle: 'Vous ne trouvez pas votre réponse ?',
    ctaBody: 'Notre équipe beauté vous répond rapidement par message ou WhatsApp.',
    ctaContact: 'Nous contacter',
    sections: [
      {
        title: 'Commandes',
        items: [
          {
            q: 'Comment passer une commande sur mDISCOVER ?',
            a: 'Parcourez la boutique, ajoutez vos soins au panier, puis validez le checkout. Vous recevez une confirmation par e-mail avec le numéro de commande pour le suivi.',
          },
          {
            q: 'Puis-je modifier ou annuler ma commande ?',
            a: 'Tant que la commande n’est pas expédiée, contactez-nous au plus vite via la page Contact ou WhatsApp avec votre numéro de commande. Après expédition, le colis suit le parcours de livraison habituel.',
          },
          {
            q: 'Comment suivre ma commande ?',
            a: 'Utilisez la page Suivi avec votre numéro de commande. Dès l’expédition, les détails transporteur (Amana, SDTM ou Carré selon la zone) y sont indiqués.',
          },
        ],
      },
      {
        title: 'Livraison',
        items: [
          {
            q: 'Livrez-vous partout au Maroc ?',
            a: 'Oui. Nous livrons dans tout le Maroc via nos partenaires Amana, SDTM et Carré. Les délais moyens sont de 2 à 5 jours ouvrés selon la ville.',
          },
          {
            q: 'Quels sont les frais de livraison ?',
            a: 'Les frais dépendent de la zone et parfois du produit. Ils sont calculés clairement au checkout avant le paiement — pas de surprise à la livraison.',
          },
          {
            q: 'Que faire si je suis absent à la livraison ?',
            a: 'Le transporteur vous recontacte en général pour une nouvelle tentative. Gardez votre téléphone joignable et vérifiez l’adresse saisie au checkout.',
          },
        ],
      },
      {
        title: 'Paiement',
        items: [
          {
            q: 'Quels moyens de paiement acceptez-vous ?',
            a: 'Paiement à la livraison (cash on delivery) pour plus de tranquillité, ou carte bancaire sécurisée (Visa / Mastercard via Stripe) selon l’option choisie au checkout.',
          },
          {
            q: 'Le paiement en ligne est-il sécurisé ?',
            a: 'Oui. Les paiements par carte sont traités par Stripe. mDISCOVER ne stocke pas vos numéros de carte.',
          },
        ],
      },
      {
        title: 'Produits & soins',
        items: [
          {
            q: 'Vos produits sont-ils authentiques ?',
            a: 'Oui. mDISCOVER sélectionne des soins de qualité, soigneusement sourcés. Chaque fiche produit détaille la marque, les bénéfices et les conseils d’utilisation.',
          },
          {
            q: 'Comment choisir le bon soin pour ma peau ?',
            a: 'Filtrez par catégorie (sérums, crèmes, sets, parfums…) et lisez les descriptions. Pour un conseil personnalisé, écrivez-nous via Contact ou WhatsApp.',
          },
          {
            q: 'Proposez-vous des coffrets cadeaux ?',
            a: 'Oui. Retrouvez nos sets et rituels dans la boutique — idéals pour offrir ou découvrir plusieurs soins ensemble.',
          },
        ],
      },
      {
        title: 'Retours',
        items: [
          {
            q: 'Puis-je retourner un produit ?',
            a: 'Les retours sont acceptés sous 14 jours pour les produits non ouverts et dans leur emballage d’origine. Contactez-nous pour lancer la procédure.',
          },
          {
            q: 'Que faire si mon colis arrive endommagé ?',
            a: 'Contactez-nous sous 48 h avec votre numéro de commande et des photos du colis. Nous trouvons rapidement une solution (remplacement ou remboursement selon le cas).',
          },
        ],
      },
      {
        title: 'Compte',
        items: [
          {
            q: 'Dois-je créer un compte pour commander ?',
            a: 'Un compte facilite le suivi et la réutilisation de vos adresses, mais vous pouvez commencer vos achats depuis la boutique. Créez un compte depuis « Mon compte » quand vous le souhaitez.',
          },
          {
            q: 'J’ai oublié mon mot de passe',
            a: 'Sur la page de connexion, utilisez l’option de réinitialisation. Vous recevrez un e-mail pour définir un nouveau mot de passe.',
          },
        ],
      },
    ],
  },
  en: {
    eyebrow: 'Help',
    title: 'Frequently asked questions',
    subtitle:
      'Everything you need to shop mDISCOVER with confidence — shipping, payment, and returns across Morocco.',
    ctaTitle: 'Still need help?',
    ctaBody: 'Our beauty team answers quickly by message or WhatsApp.',
    ctaContact: 'Contact us',
    sections: [
      {
        title: 'Orders',
        items: [
          {
            q: 'How do I place an order?',
            a: 'Browse the shop, add products to your bag, then complete checkout. You’ll receive an email confirmation with your order number for tracking.',
          },
          {
            q: 'Can I change or cancel my order?',
            a: 'If it hasn’t shipped yet, contact us ASAP via Contact or WhatsApp with your order number. Once shipped, the parcel follows the carrier’s delivery flow.',
          },
          {
            q: 'How do I track my order?',
            a: 'Use the Order tracking page with your order number. After dispatch, carrier details (Amana, SDTM, or Carré depending on zone) appear there.',
          },
        ],
      },
      {
        title: 'Shipping',
        items: [
          {
            q: 'Do you deliver nationwide in Morocco?',
            a: 'Yes. We ship across Morocco with Amana, SDTM, and Carré. Typical delivery is 2–5 business days depending on your city.',
          },
          {
            q: 'How much is shipping?',
            a: 'Fees depend on zone and sometimes the product. They’re calculated clearly at checkout before you pay — no surprises on delivery.',
          },
          {
            q: 'What if I’m not home for delivery?',
            a: 'Carriers usually retry or contact you. Keep your phone reachable and double-check the address at checkout.',
          },
        ],
      },
      {
        title: 'Payment',
        items: [
          {
            q: 'Which payment methods do you accept?',
            a: 'Cash on delivery for peace of mind, or secure card payment (Visa / Mastercard via Stripe), depending on the option you choose at checkout.',
          },
          {
            q: 'Is online payment secure?',
            a: 'Yes. Card payments are processed by Stripe. mDISCOVER never stores your full card number.',
          },
        ],
      },
      {
        title: 'Products & care',
        items: [
          {
            q: 'Are your products authentic?',
            a: 'Yes. mDISCOVER curates quality skincare, carefully sourced. Each product page lists the brand, benefits, and usage tips.',
          },
          {
            q: 'How do I choose the right product?',
            a: 'Filter by category (serums, creams, sets, fragrances…) and read the descriptions. For personal advice, message us via Contact or WhatsApp.',
          },
          {
            q: 'Do you offer gift sets?',
            a: 'Yes. Explore our sets and rituals in the shop — perfect for gifting or discovering several products together.',
          },
        ],
      },
      {
        title: 'Returns',
        items: [
          {
            q: 'Can I return a product?',
            a: 'Returns are accepted within 14 days for unopened products in original packaging. Contact us to start the process.',
          },
          {
            q: 'What if my parcel arrives damaged?',
            a: 'Contact us within 48 hours with your order number and photos of the parcel. We’ll resolve it quickly (replacement or refund as appropriate).',
          },
        ],
      },
      {
        title: 'Account',
        items: [
          {
            q: 'Do I need an account to order?',
            a: 'An account makes tracking and saved addresses easier, but you can start shopping from the catalog. Create an account anytime from My Account.',
          },
          {
            q: 'I forgot my password',
            a: 'On the login screen, use the reset option. You’ll receive an email to set a new password.',
          },
        ],
      },
    ],
  },
  ar: {
    eyebrow: 'المساعدة',
    title: 'الأسئلة الشائعة',
    subtitle:
      'كل ما تحتاجينه للتسوق من mDISCOVER بثقة — الشحن والدفع والإرجاع في جميع أنحاء المغرب.',
    ctaTitle: 'لم تجدي إجابتك؟',
    ctaBody: 'فريقنا يجيب بسرعة عبر الرسائل أو واتساب.',
    ctaContact: 'تواصلي معنا',
    sections: [
      {
        title: 'الطلبات',
        items: [
          {
            q: 'كيف أقدّم طلباً؟',
            a: 'تصفّحي المتجر، أضيفي المنتجات إلى السلة، ثم أكملي الدفع. ستصلك رسالة تأكيد برقم الطلب للمتابعة.',
          },
          {
            q: 'هل يمكنني تعديل أو إلغاء طلبي؟',
            a: 'إذا لم يُشحن بعد، تواصلي معنا فوراً عبر صفحة الاتصال أو واتساب مع رقم الطلب. بعد الشحن يتبع الطرد مسار الناقل المعتاد.',
          },
          {
            q: 'كيف أتابع طلبي؟',
            a: 'استخدمي صفحة التتبع مع رقم الطلب. بعد الإرسال تظهر تفاصيل الناقل (Amana أو SDTM أو Carré حسب المنطقة).',
          },
        ],
      },
      {
        title: 'الشحن',
        items: [
          {
            q: 'هل التوصيل متاح في كل المغرب؟',
            a: 'نعم. نشحن عبر Amana و SDTM و Carré. المدة عادة من 2 إلى 5 أيام عمل حسب المدينة.',
          },
          {
            q: 'كم تكلفة الشحن؟',
            a: 'تُحسب الرسوم حسب المنطقة وأحياناً المنتج، وتظهر بوضوح عند الدفع قبل الإتمام — بدون مفاجآت عند الاستلام.',
          },
          {
            q: 'ماذا لو لم أكن متواجدة عند التوصيل؟',
            a: 'عادة يعيد الناقل المحاولة أو يتواصل معكِ. أبقي هاتفكِ متاحاً وتحققي من العنوان عند الدفع.',
          },
        ],
      },
      {
        title: 'الدفع',
        items: [
          {
            q: 'ما طرق الدفع المتاحة؟',
            a: 'الدفع عند الاستلام لراحة البال، أو بطاقة بنكية آمنة (Visa / Mastercard عبر Stripe) حسب الخيار عند الدفع.',
          },
          {
            q: 'هل الدفع عبر الإنترنت آمن؟',
            a: 'نعم. تتم معالجة البطاقات عبر Stripe. لا نخزّن رقم بطاقتكِ الكامل.',
          },
        ],
      },
      {
        title: 'المنتجات والعناية',
        items: [
          {
            q: 'هل المنتجات أصلية؟',
            a: 'نعم. تختار mDISCOVER عناية عالية الجودة بعناية. كل صفحة منتج توضّح العلامة والفوائد ونصائح الاستخدام.',
          },
          {
            q: 'كيف أختار المنتج المناسب؟',
            a: 'فلترة حسب الفئة (سيروم، كريمات، مجموعات، عطور…) وقراءة الوصف. للنصيحة الشخصية راسلينا عبر الاتصال أو واتساب.',
          },
          {
            q: 'هل لديكم مجموعات هدايا؟',
            a: 'نعم. اكتشفي المجموعات والطقوس في المتجر — مثالية للإهداء أو لتجربة عدة منتجات معاً.',
          },
        ],
      },
      {
        title: 'الإرجاع',
        items: [
          {
            q: 'هل يمكنني إرجاع منتج؟',
            a: 'يُقبل الإرجاع خلال 14 يوماً للمنتجات غير المفتوحة وبتغليفها الأصلي. تواصلي معنا لبدء الإجراء.',
          },
          {
            q: 'ماذا لو وصل الطرد تالفاً؟',
            a: 'تواصلي معنا خلال 48 ساعة مع رقم الطلب وصور للطرد. سنحل الأمر بسرعة (استبدال أو استرداد حسب الحالة).',
          },
        ],
      },
      {
        title: 'الحساب',
        items: [
          {
            q: 'هل أحتاج حساباً للطلب؟',
            a: 'الحساب يسهّل التتبع والعناوين المحفوظة، ويمكنكِ البدء بالتسوق من الكتالوج. أنشئي حساباً متى شئتِ من «حسابي».',
          },
          {
            q: 'نسيت كلمة المرور',
            a: 'في شاشة تسجيل الدخول استخدمي خيار إعادة التعيين. ستصلك رسالة لتعيين كلمة مرور جديدة.',
          },
        ],
      },
    ],
  },
};

function AccordionItem({
  item,
  open,
  onToggle,
}: {
  item: FaqItem;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-[#E8D4D5]/90 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-start justify-between gap-4 py-4 sm:py-5 text-left group"
      >
        <span className="font-sans text-[15px] sm:text-base font-medium text-charcoal-900 group-hover:text-[#A96868] transition-colors">
          {item.q}
        </span>
        <ChevronDown
          size={18}
          className={`mt-1 shrink-0 text-[#B77D7E] transition-transform duration-300 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <p className="pb-4 sm:pb-5 pr-8 text-sm sm:text-[15px] leading-relaxed text-charcoal-600 font-sans">
            {item.a}
          </p>
        </div>
      </div>
    </div>
  );
}

export function FaqPageContent() {
  const { locale } = useLocale();
  const copy = COPY[locale] ?? COPY.fr;
  const [openKey, setOpenKey] = useState<string | null>('0-0');

  return (
    <div className="bg-[#FBF8F4] min-h-[calc(100svh-12rem)]">
      <div className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(169,104,104,0.14), transparent 60%), radial-gradient(ellipse 40% 30% at 100% 20%, rgba(232,212,213,0.45), transparent)',
          }}
        />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 lg:pt-20 pb-8 sm:pb-10">
          <p className="text-[10px] uppercase tracking-[0.24em] text-[#B77D7E] font-sans font-medium mb-2">
            {copy.eyebrow}
          </p>
          <h1 className="font-display text-3xl sm:text-[2.5rem] font-normal text-charcoal-900 tracking-tight">
            {copy.title}
          </h1>
          <p className="mt-3 text-sm sm:text-[15px] leading-relaxed text-charcoal-600 font-sans max-w-xl">
            {copy.subtitle}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20 space-y-8">
        {copy.sections.map((section, sIdx) => (
          <section
            key={section.title}
            className="rounded-[20px] border border-[#E8D4D5] bg-[#FFF9F5] px-5 sm:px-7 shadow-[0_16px_48px_rgba(169,104,104,0.08)]"
          >
            <h2 className="pt-5 sm:pt-6 pb-1 font-display text-lg sm:text-xl text-charcoal-900">
              {section.title}
            </h2>
            <div>
              {section.items.map((item, iIdx) => {
                const key = `${sIdx}-${iIdx}`;
                return (
                  <AccordionItem
                    key={key}
                    item={item}
                    open={openKey === key}
                    onToggle={() => setOpenKey(openKey === key ? null : key)}
                  />
                );
              })}
            </div>
          </section>
        ))}

        <div className="rounded-[20px] border border-[#E8D4D5] bg-white px-6 sm:px-8 py-8 sm:py-10 text-center">
          <h2 className="font-display text-xl sm:text-2xl text-charcoal-900">{copy.ctaTitle}</h2>
          <p className="mt-2 text-sm text-charcoal-600 font-sans max-w-md mx-auto">{copy.ctaBody}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-full bg-[#A96868] px-6 py-2.5 text-sm font-sans font-medium text-white hover:bg-[#9B6264] transition-colors"
            >
              {copy.ctaContact}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
