import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { notFound } from 'next/navigation';

interface Props {
  params: { orderNumber: string };
}

export default async function OrderConfirmationPage({ params }: Props) {
  let order;
  try {
    order = await apiFetchOrder(params.orderNumber);
  } catch {
    notFound();
  }

  return (
    <div className="min-h-[70vh] bg-[#FBF8F4]">
      <div className="max-w-xl mx-auto px-4 py-16 sm:py-20 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#F8F2ED] text-[#A96868] text-2xl">
          ✓
        </div>
        <p className="text-[10px] uppercase tracking-[0.28em] text-[#B77D7E] font-sans font-medium mb-2">
          Confirmation
        </p>
        <h1 className="font-display text-3xl sm:text-4xl text-[#1C1714] tracking-tight mb-4">
          Merci pour votre commande
        </h1>
        <p className="text-[#6B625A] font-sans mb-2">
          Commande n° <strong className="text-[#1C1714]">{order.orderNumber}</strong>
        </p>
        <p className="text-sm text-[#A89888] font-sans mb-6">
          Un email de confirmation a été envoyé
          {order.guestEmail ? ` à ${order.guestEmail}` : ''}.
        </p>
        <p className="font-display text-2xl text-[#A96868] mb-10">{formatPrice(order.total)}</p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={`/suivi/${order.orderNumber}`}
            className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#A96868] px-8 text-[11px] uppercase tracking-[0.16em] font-semibold text-[#FFF9F5] font-sans shadow-[0_4px_14px_rgba(169,104,104,0.28)] hover:bg-[#9B6264] transition-colors"
          >
            Suivre ma commande
          </Link>
          <Link
            href="/compte/commandes"
            className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-[#E8D4D5] bg-white px-8 text-[11px] uppercase tracking-[0.16em] font-semibold text-[#1C1714] font-sans hover:border-[#C48782] transition-colors"
          >
            Mes commandes
          </Link>
        </div>

        <Link
          href="/products"
          className="mt-6 inline-block text-[11px] uppercase tracking-[0.14em] text-[#A96868] font-sans font-semibold hover:text-[#9B6264]"
        >
          Continuer mes achats →
        </Link>
      </div>
    </div>
  );
}

async function apiFetchOrder(orderNumber: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${orderNumber}`, {
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error();
  return res.json();
}
