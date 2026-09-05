'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { StripeCheckout } from '@/components/checkout/StripeCheckout';

function PaymentContent() {
  const params = useSearchParams();
  const orderId = params.get('orderId');
  const orderNumber = params.get('orderNumber');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/create-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    })
      .then((r) => r.json())
      .then((data) => setClientSecret(data.clientSecret))
      .catch(() => setError('Impossible d\'initialiser le paiement'));
  }, [orderId]);

  if (!orderId || !orderNumber) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <p className="text-charcoal-500 mb-4">Session de paiement invalide.</p>
        <Link href="/panier" className="btn-primary">Retour au panier</Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="section-title mb-2">Paiement sécurisé</h1>
      <p className="text-charcoal-500 text-sm mb-8">Commande {orderNumber}</p>

      {error && <p className="text-red-600 mb-4">{error}</p>}
      {!clientSecret && !error && <p className="text-center py-12 text-charcoal-500">Chargement...</p>}
      {clientSecret && (
        <div className="bg-white border border-cream-300 p-6">
          <StripeCheckout clientSecret={clientSecret} orderNumber={orderNumber} />
        </div>
      )}
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="text-center py-20">Chargement...</div>}>
      <PaymentContent />
    </Suspense>
  );
}
