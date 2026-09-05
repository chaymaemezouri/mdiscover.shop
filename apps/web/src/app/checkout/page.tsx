import { Suspense } from 'react';
import CheckoutClient from './CheckoutClient';

export const metadata = { title: 'Checkout' };

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] bg-[#FBF8F4] flex items-center justify-center text-[#6B625A] font-sans text-sm">
          Chargement…
        </div>
      }
    >
      <CheckoutClient />
    </Suspense>
  );
}
