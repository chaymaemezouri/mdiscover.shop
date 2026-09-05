import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../../prisma/prisma.service';
import { AmanaService } from '../shipping/shipping.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private stripe: Stripe | null = null;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private amana: AmanaService,
  ) {
    const key = config.get<string>('STRIPE_SECRET_KEY');
    if (key?.startsWith('sk_')) {
      this.stripe = new Stripe(key);
    }
  }

  async createPaymentIntent(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });
    if (!order) throw new NotFoundException('Commande introuvable');
    if (order.payment?.method !== 'STRIPE') {
      throw new BadRequestException('Cette commande n\'est pas en paiement Stripe');
    }

    if (!this.stripe) {
      this.logger.warn('Stripe non configuré — mode mock');
      return {
        clientSecret: 'mock_secret_for_dev',
        paymentIntentId: 'pi_mock_dev',
        mock: true,
      };
    }

    const intent = await this.stripe.paymentIntents.create({
      amount: order.total,
      currency: order.currency.toLowerCase(),
      metadata: { orderId: order.id, orderNumber: order.orderNumber },
      automatic_payment_methods: { enabled: true },
    });

    await this.prisma.payment.update({
      where: { orderId },
      data: { stripePaymentIntentId: intent.id },
    });

    return { clientSecret: intent.client_secret, paymentIntentId: intent.id };
  }

  async handleWebhook(payload: Buffer, signature: string) {
    if (!this.stripe) return { received: true };

    const secret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!secret) throw new BadRequestException('Webhook secret manquant');

    const event = this.stripe.webhooks.constructEvent(payload, signature, secret);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const intent = event.data.object as Stripe.PaymentIntent;
        const orderId = intent.metadata.orderId;
        if (orderId) {
          await this.prisma.$transaction([
            this.prisma.payment.update({
              where: { orderId },
              data: { status: 'PAID', stripeChargeId: intent.latest_charge as string },
            }),
            this.prisma.order.update({
              where: { id: orderId },
              data: { status: 'CONFIRMED' },
            }),
            this.prisma.orderStatusHistory.create({
              data: { orderId, status: 'CONFIRMED', note: 'Paiement Stripe confirmé' },
            }),
          ]);
          await this.amana.createShipment(orderId).catch((e) =>
            this.logger.warn(`Amana auto-create failed: ${e}`),
          );
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent;
        const orderId = intent.metadata.orderId;
        if (orderId) {
          await this.prisma.payment.update({
            where: { orderId },
            data: { status: 'FAILED' },
          });
        }
        break;
      }
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const payment = await this.prisma.payment.findFirst({
          where: { stripeChargeId: charge.id },
        });
        if (payment) {
          await this.prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'REFUNDED', refundedAmount: charge.amount_refunded },
          });
          await this.prisma.order.update({
            where: { id: payment.orderId },
            data: { status: 'REFUNDED' },
          });
        }
        break;
      }
    }

    return { received: true };
  }
}
