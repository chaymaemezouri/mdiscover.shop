'use client';

import { FormEvent, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  CreditCard,
  Lock,
  MapPin,
  ShoppingBag,
  Truck,
  User,
  Wallet,
} from 'lucide-react';
import { api, type Cart } from '@/lib/api';
import { getAccessToken } from '@/lib/auth-client';
import { formatPrice, getSessionId } from '@/lib/utils';

const STEPS = [
  { id: 'info', label: 'Informations', icon: User },
  { id: 'address', label: 'Adresse', icon: MapPin },
  { id: 'shipping', label: 'Livraison', icon: Truck },
  { id: 'payment', label: 'Paiement', icon: CreditCard },
] as const;

const MOROCCAN_CITIES = [
  'Casablanca',
  'Rabat',
  'Marrakech',
  'Fès',
  'Tanger',
  'Agadir',
  'Meknès',
  'Oujda',
  'Salé',
  'Témara',
  'Mohammedia',
  'Kénitra',
];

const inputClass =
  'w-full rounded-xl border border-[#E8D4D5] bg-white px-4 py-3 text-sm text-[#1C1714] font-sans placeholder:text-[#A89888] transition-colors focus:outline-none focus:border-[#A96868] focus:ring-2 focus:ring-[#A96868]/15';

const labelClass =
  'mb-1.5 block text-[10px] uppercase tracking-[0.16em] text-[#6B625A] font-sans font-medium';

export default function CheckoutClient() {
  const params = useSearchParams();
  const router = useRouter();
  const cartId = params.get('cartId');
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [cart, setCart] = useState<Cart | null>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: 'Casablanca',
    paymentMethod: 'COD' as 'STRIPE' | 'COD',
  });

  useEffect(() => {
    api.cart
      .get(getSessionId())
      .then(setCart)
      .catch(() => setCart(null));
  }, []);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setError('');
  }

  function canContinue(current: number) {
    if (current === 0) {
      return Boolean(form.firstName.trim() && form.lastName.trim() && form.email.trim() && form.phone.trim());
    }
    if (current === 1) {
      return Boolean(form.address.trim() && form.city.trim());
    }
    return true;
  }

  function goNext() {
    if (!canContinue(step)) {
      setError('Merci de remplir tous les champs requis.');
      return;
    }
    setError('');
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setError('');
    setStep((s) => Math.max(s - 1, 0));
  }

  async function submitOrder(e?: FormEvent) {
    e?.preventDefault();
    if (!canContinue(0) || !canContinue(1)) {
      setError('Merci de vérifier vos informations.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const token = getAccessToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          cartId,
          paymentMethod: form.paymentMethod,
          guestEmail: form.email,
          shippingCost: 0,
          shippingAddress: {
            firstName: form.firstName,
            lastName: form.lastName,
            phone: form.phone,
            addressLine1: form.address,
            city: form.city,
            country: 'MA',
          },
        }),
      });
      if (!res.ok) throw new Error('Erreur commande');
      const order = await res.json();

      if (form.paymentMethod === 'STRIPE') {
        router.push(`/checkout/payment?orderId=${order.id}&orderNumber=${order.orderNumber}`);
      } else {
        router.push(`/commande/${order.orderNumber}`);
      }
    } catch {
      setError('Erreur lors de la commande. Vérifiez vos informations.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!cartId) {
    return (
      <div className="min-h-[60vh] bg-[#FBF8F4] flex flex-col items-center justify-center px-4 py-20 text-center">
        <ShoppingBag size={40} className="text-[#E8D4D5] mb-4" strokeWidth={1.25} />
        <h1 className="font-display text-2xl text-[#1C1714] mb-2">Panier introuvable</h1>
        <p className="text-sm text-[#6B625A] font-sans mb-8 max-w-sm">
          Reprenez votre sélection dans la boutique pour finaliser la commande.
        </p>
        <Link
          href="/panier"
          className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#A96868] px-8 text-[11px] uppercase tracking-[0.16em] font-semibold text-[#FFF9F5] shadow-[0_4px_14px_rgba(169,104,104,0.28)] hover:bg-[#9B6264] transition-colors"
        >
          Retour au panier
        </Link>
      </div>
    );
  }

  const StepIcon = STEPS[step].icon;

  return (
    <div className="min-h-screen bg-[#FBF8F4]">
      <section className="border-b border-[#E8D4D5]/80 bg-[#FFF9F5]">
        <div className="w-full px-4 sm:px-8 lg:px-10 xl:px-14 py-8 sm:py-10">
          <nav className="text-[11px] text-[#6B625A] mb-4 font-sans">
            <Link href="/panier" className="hover:text-[#A96868] transition-colors">
              Panier
            </Link>
            <span className="mx-2 text-[#E8D4D5]">/</span>
            <span className="text-[#1C1714]">Commande</span>
          </nav>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#B77D7E] font-sans font-medium mb-2">
            Checkout
          </p>
          <h1 className="font-display text-3xl sm:text-4xl text-[#1C1714] tracking-tight">
            Finaliser votre commande
          </h1>
        </div>
      </section>

      <div className="w-full px-4 sm:px-8 lg:px-10 xl:px-14 py-8 sm:py-10 lg:py-12">
        <div className="mx-auto grid max-w-6xl gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] xl:grid-cols-[minmax(0,1fr)_380px] lg:gap-10 xl:gap-12">
          <div className="min-w-0">
            {/* Progress */}
            <ol className="mb-8 flex items-center gap-1 sm:gap-2">
              {STEPS.map((s, i) => {
                const done = i < step;
                const active = i === step;
                return (
                  <li key={s.id} className="flex flex-1 items-center gap-1 sm:gap-2 min-w-0">
                    <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
                      <span
                        className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border text-xs font-sans transition-colors ${
                          done
                            ? 'border-[#A96868] bg-[#A96868] text-[#FFF9F5]'
                            : active
                              ? 'border-[#A96868] bg-white text-[#A96868]'
                              : 'border-[#E8D4D5] bg-white text-[#A89888]'
                        }`}
                      >
                        {done ? <Check size={16} strokeWidth={2} /> : i + 1}
                      </span>
                      <span
                        className={`hidden sm:block text-[10px] uppercase tracking-[0.14em] font-sans truncate max-w-full ${
                          active || done ? 'text-[#1C1714]' : 'text-[#A89888]'
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <span
                        className={`mb-5 sm:mb-6 h-px flex-1 min-w-[8px] ${
                          done ? 'bg-[#A96868]' : 'bg-[#E8D4D5]'
                        }`}
                        aria-hidden
                      />
                    )}
                  </li>
                );
              })}
            </ol>

            <div className="rounded-[20px] border border-[#E8D4D5]/90 bg-[#FFF9F5] p-5 sm:p-7 shadow-[0_8px_32px_rgba(169,104,104,0.06)]">
              <div className="mb-6 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F8F2ED] text-[#A96868]">
                  <StepIcon size={18} strokeWidth={1.5} />
                </span>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#A89888] font-sans">
                    Étape {step + 1} / {STEPS.length}
                  </p>
                  <h2 className="font-display text-xl sm:text-2xl text-[#1C1714] tracking-tight">
                    {STEPS[step].label}
                  </h2>
                </div>
              </div>

              {error && (
                <p className="mb-4 rounded-xl border border-[#E8D4D5] bg-white px-4 py-3 text-sm text-[#A96868] font-sans">
                  {error}
                </p>
              )}

              {step === 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass} htmlFor="firstName">
                        Prénom
                      </label>
                      <input
                        id="firstName"
                        required
                        value={form.firstName}
                        onChange={(e) => update('firstName', e.target.value)}
                        className={inputClass}
                        autoComplete="given-name"
                      />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="lastName">
                        Nom
                      </label>
                      <input
                        id="lastName"
                        required
                        value={form.lastName}
                        onChange={(e) => update('lastName', e.target.value)}
                        className={inputClass}
                        autoComplete="family-name"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="email">
                      Email
                    </label>
                    <input
                      id="email"
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                      className={inputClass}
                      autoComplete="email"
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="phone">
                      Téléphone
                    </label>
                    <input
                      id="phone"
                      required
                      value={form.phone}
                      onChange={(e) => update('phone', e.target.value)}
                      className={inputClass}
                      autoComplete="tel"
                      placeholder="+212 6XX XXX XXX"
                    />
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className={labelClass} htmlFor="address">
                      Adresse
                    </label>
                    <input
                      id="address"
                      required
                      value={form.address}
                      onChange={(e) => update('address', e.target.value)}
                      className={inputClass}
                      autoComplete="street-address"
                      placeholder="Numéro, rue, quartier…"
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="city">
                      Ville
                    </label>
                    <select
                      id="city"
                      value={form.city}
                      onChange={(e) => update('city', e.target.value)}
                      className={inputClass}
                    >
                      {MOROCCAN_CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-3">
                  <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-[#A96868] bg-white p-4 sm:p-5 shadow-[0_4px_16px_rgba(169,104,104,0.08)]">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-[#A96868]">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#A96868]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Truck size={16} className="text-[#A96868]" strokeWidth={1.5} />
                        <p className="font-sans text-sm font-semibold text-[#1C1714]">Amana Express</p>
                      </div>
                      <p className="mt-1 text-sm text-[#6B625A] font-sans leading-relaxed">
                        Livraison soignée sous 2 à 5 jours ouvrés partout au Maroc.
                      </p>
                    </div>
                  </label>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => update('paymentMethod', 'COD')}
                    className={`flex w-full cursor-pointer items-start gap-4 rounded-2xl border p-4 sm:p-5 text-left transition-all ${
                      form.paymentMethod === 'COD'
                        ? 'border-[#A96868] bg-white shadow-[0_4px_16px_rgba(169,104,104,0.08)]'
                        : 'border-[#E8D4D5] bg-white/70 hover:border-[#C48782]'
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                        form.paymentMethod === 'COD' ? 'border-[#A96868]' : 'border-[#E8D4D5]'
                      }`}
                    >
                      {form.paymentMethod === 'COD' && (
                        <span className="h-2.5 w-2.5 rounded-full bg-[#A96868]" />
                      )}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <Wallet size={16} className="text-[#A96868]" strokeWidth={1.5} />
                        <p className="font-sans text-sm font-semibold text-[#1C1714]">
                          Paiement à la livraison
                        </p>
                      </div>
                      <p className="mt-1 text-sm text-[#6B625A] font-sans">
                        Payez en espèces à la réception de votre commande.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => update('paymentMethod', 'STRIPE')}
                    className={`flex w-full cursor-pointer items-start gap-4 rounded-2xl border p-4 sm:p-5 text-left transition-all ${
                      form.paymentMethod === 'STRIPE'
                        ? 'border-[#A96868] bg-white shadow-[0_4px_16px_rgba(169,104,104,0.08)]'
                        : 'border-[#E8D4D5] bg-white/70 hover:border-[#C48782]'
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                        form.paymentMethod === 'STRIPE' ? 'border-[#A96868]' : 'border-[#E8D4D5]'
                      }`}
                    >
                      {form.paymentMethod === 'STRIPE' && (
                        <span className="h-2.5 w-2.5 rounded-full bg-[#A96868]" />
                      )}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <CreditCard size={16} className="text-[#A96868]" strokeWidth={1.5} />
                        <p className="font-sans text-sm font-semibold text-[#1C1714]">
                          Carte bancaire
                        </p>
                      </div>
                      <p className="mt-1 text-sm text-[#6B625A] font-sans">
                        Visa, Mastercard — paiement sécurisé.
                      </p>
                    </div>
                  </button>
                </div>
              )}

              <div className="mt-8 flex flex-col-reverse sm:flex-row sm:items-center gap-3 sm:justify-between">
                {step > 0 ? (
                  <button
                    type="button"
                    onClick={goBack}
                    className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-[#E8D4D5] bg-white px-5 text-[11px] uppercase tracking-[0.14em] font-semibold text-[#1C1714] font-sans hover:border-[#C48782] transition-colors"
                  >
                    <ArrowLeft size={14} strokeWidth={1.75} />
                    Retour
                  </button>
                ) : (
                  <Link
                    href="/panier"
                    className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-[#E8D4D5] bg-white px-5 text-[11px] uppercase tracking-[0.14em] font-semibold text-[#1C1714] font-sans hover:border-[#C48782] transition-colors"
                  >
                    <ArrowLeft size={14} strokeWidth={1.75} />
                    Panier
                  </Link>
                )}

                {step < STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={goNext}
                    className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#A96868] px-8 text-[11px] uppercase tracking-[0.16em] font-semibold text-[#FFF9F5] font-sans shadow-[0_4px_14px_rgba(169,104,104,0.28)] hover:bg-[#9B6264] transition-colors"
                  >
                    Continuer
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => submitOrder()}
                    disabled={submitting}
                    className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[#A96868] px-8 text-[11px] uppercase tracking-[0.16em] font-semibold text-[#FFF9F5] font-sans shadow-[0_4px_14px_rgba(169,104,104,0.28)] hover:bg-[#9B6264] transition-colors disabled:opacity-60"
                  >
                    <Lock size={14} strokeWidth={2} />
                    {submitting ? 'Traitement…' : 'Confirmer la commande'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Summary */}
          <aside className="lg:sticky lg:top-24 h-fit">
            <div className="overflow-hidden rounded-[20px] border border-[#E8D4D5]/90 bg-gradient-to-b from-[#FFF9F5] to-[#F8F2ED] shadow-[0_8px_32px_rgba(169,104,104,0.06)]">
              <div className="h-2 bg-[#A96868]" />
              <div className="p-5 sm:p-6">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#6B625A] font-sans font-medium mb-4">
                  Votre commande
                </p>

                {cart && cart.items.length > 0 ? (
                  <ul className="space-y-4 mb-6">
                    {cart.items.map((item) => (
                      <li key={item.id} className="flex gap-3">
                        <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-[#F8F2ED]">
                          {item.product.image ? (
                            <Image
                              src={item.product.image}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                              sizes="56px"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[#E8D4D5]">
                              <ShoppingBag size={16} strokeWidth={1.25} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-sans text-sm text-[#1C1714] line-clamp-2 leading-snug">
                            {item.product.name}
                          </p>
                          <p className="mt-1 text-[11px] text-[#A89888] font-sans">
                            Qté {item.quantity}
                          </p>
                        </div>
                        <p className="shrink-0 font-sans text-sm text-[#1C1714] tabular-nums">
                          {formatPrice(item.unitPrice * item.quantity)}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mb-6 text-sm text-[#6B625A] font-sans">Récapitulatif en cours…</p>
                )}

                <div className="border-t border-[#E8D4D5]/80 pt-4 space-y-2">
                  <div className="flex justify-between text-sm font-sans text-[#6B625A]">
                    <span>Sous-total</span>
                    <span className="text-[#1C1714] tabular-nums">
                      {formatPrice(cart?.subtotal ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline pt-2">
                    <span className="text-[10px] uppercase tracking-[0.16em] text-[#6B625A] font-sans">
                      Total
                    </span>
                    <span className="font-display text-2xl text-[#A96868] tracking-tight tabular-nums">
                      {formatPrice(cart?.subtotal ?? 0)}
                    </span>
                  </div>
                </div>

                <p className="mt-5 flex items-center gap-2 text-[11px] text-[#A89888] font-sans leading-relaxed">
                  <Lock size={12} strokeWidth={1.75} className="shrink-0" />
                  Paiement sécurisé · Vos données restent confidentielles
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
