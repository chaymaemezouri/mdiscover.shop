'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? 'pk_test_placeholder',
);

function PaymentForm({ orderNumber, onSuccess }: { orderNumber: string; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/commande/${orderNumber}`,
      },
      redirect: 'if_required',
    });

    if (submitError) {
      setError(submitError.message ?? 'Paiement échoué');
      setLoading(false);
    } else {
      onSuccess();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement options={{ layout: 'tabs' }} />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button type="submit" disabled={!stripe || loading} className="btn-primary w-full">
        {loading ? 'Traitement...' : 'Payer maintenant'}
      </button>
    </form>
  );
}

export function StripeCheckout({ clientSecret, orderNumber }: { clientSecret: string; orderNumber: string }) {
  if (clientSecret.startsWith('mock_')) {
    return (
      <div className="text-center py-8">
        <p className="text-charcoal-600 mb-4">Mode développement — Stripe non configuré</p>
        <a href={`/commande/${orderNumber}`} className="btn-primary">Continuer (mock)</a>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#C5A028' } } }}>
      <PaymentForm
        orderNumber={orderNumber}
        onSuccess={() => { window.location.href = `/commande/${orderNumber}`; }}
      />
    </Elements>
  );
}
