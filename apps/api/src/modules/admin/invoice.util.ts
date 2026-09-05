import { APP_NAME } from '@mdiscovershop/shared';

interface OrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

interface InvoiceOrder {
  orderNumber: string;
  createdAt: Date;
  status: string;
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  guestEmail?: string | null;
  shippingAddress?: Record<string, string> | null | unknown;
  user?: { email: string; firstName?: string | null; lastName?: string | null } | null;
  items: OrderItem[];
  payment?: { method: string; status: string } | null;
}

function formatMAD(centimes: number) {
  return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(centimes / 100);
}

export function buildInvoiceHtml(order: InvoiceOrder): string {
  const addr = order.shippingAddress as { firstName?: string; lastName?: string; address?: string; city?: string; phone?: string } | null;
  const customerName = order.user
    ? [order.user.firstName, order.user.lastName].filter(Boolean).join(' ')
    : addr
      ? [addr.firstName, addr.lastName].filter(Boolean).join(' ')
      : 'Client';
  const email = order.user?.email ?? order.guestEmail ?? '';

  const rows = order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #eee">${item.name}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatMAD(item.unitPrice)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatMAD(item.unitPrice * item.quantity)}</td>
        </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <title>Facture ${order.orderNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; color: #1a1a1a; }
    h1 { font-size: 24px; margin-bottom: 4px; }
    .meta { color: #666; font-size: 14px; margin-bottom: 32px; }
    table { width: 100%; border-collapse: collapse; margin: 24px 0; }
    th { background: #f5f5f5; padding: 8px; text-align: left; font-size: 12px; text-transform: uppercase; }
    .totals td { padding: 6px 8px; }
    .totals .label { text-align: right; color: #666; }
    .totals .value { text-align: right; font-weight: 600; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <h1>${APP_NAME}</h1>
  <p class="meta">Facture n° ${order.orderNumber} · ${new Date(order.createdAt).toLocaleDateString('fr-FR')}</p>

  <div style="display:flex;justify-content:space-between;margin-bottom:32px">
    <div>
      <strong>Client</strong><br/>
      ${customerName}<br/>
      ${email}<br/>
      ${addr?.phone ? `${addr.phone}<br/>` : ''}
      ${addr?.address ? `${addr.address}<br/>` : ''}
      ${addr?.city ?? ''}
    </div>
    <div>
      <strong>Paiement</strong><br/>
      ${order.payment?.method ?? '—'} · ${order.payment?.status ?? '—'}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Produit</th>
        <th style="text-align:center">Qté</th>
        <th style="text-align:right">Prix unit.</th>
        <th style="text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <table class="totals" style="width:300px;margin-left:auto">
    <tr><td class="label">Sous-total</td><td class="value">${formatMAD(order.subtotal)}</td></tr>
    <tr><td class="label">Livraison</td><td class="value">${formatMAD(order.shippingCost)}</td></tr>
    ${order.discount > 0 ? `<tr><td class="label">Réduction</td><td class="value">-${formatMAD(order.discount)}</td></tr>` : ''}
    <tr><td class="label"><strong>Total</strong></td><td class="value"><strong>${formatMAD(order.total)}</strong></td></tr>
  </table>

  <p style="margin-top:48px;font-size:12px;color:#999;text-align:center">
    ${APP_NAME} · Merci pour votre commande
  </p>
</body>
</html>`;
}
