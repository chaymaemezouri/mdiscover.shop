import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

export interface ShippingQuote {
  price: number;
  freeShipping: boolean;
  zoneName: string;
  estimatedDays: string;
}

@Injectable()
export class ShippingService {
  constructor(private prisma: PrismaService) {}

  async calculateShipping(city: string, subtotal: number): Promise<ShippingQuote> {
    const normalizedCity = city.trim().toLowerCase();
    const zones = await this.prisma.shippingZone.findMany({ where: { isActive: true } });

    const zone =
      zones.find((z) => z.cities.some((c) => c.toLowerCase() === normalizedCity)) ??
      zones.find((z) => z.cities.length === 0) ??
      zones[zones.length - 1];

    if (!zone) {
      return { price: 4500, freeShipping: false, zoneName: 'Standard', estimatedDays: '3-5 jours' };
    }

    const freeShipping = zone.freeAbove != null && subtotal >= zone.freeAbove;
    return {
      price: freeShipping ? 0 : zone.price,
      freeShipping,
      zoneName: zone.name,
      estimatedDays: '2-5 jours',
    };
  }

  async getZones() {
    return this.prisma.shippingZone.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
  }

  async adminListZones(search?: string, isActive?: string) {
    const where: {
      OR?: Array<{ name?: { contains: string; mode: 'insensitive' } } | { cities?: { has: string } }>;
      isActive?: boolean;
    } = {};
    if (search?.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { cities: { has: q } },
      ];
    }
    if (isActive === 'true') where.isActive = true;
    if (isActive === 'false') where.isActive = false;

    return this.prisma.shippingZone.findMany({ where, orderBy: { name: 'asc' } });
  }

  async getZone(id: string) {
    const zone = await this.prisma.shippingZone.findUnique({ where: { id } });
    if (!zone) throw new NotFoundException('Zone introuvable');
    return zone;
  }

  async createZone(data: {
    name: string;
    cities?: string[];
    regions?: string[];
    price: number;
    freeAbove?: number | null;
    isActive?: boolean;
  }) {
    const name = String(data.name ?? '').trim();
    if (!name) throw new BadRequestException('Nom de zone requis');
    return this.prisma.shippingZone.create({
      data: {
        name,
        cities: data.cities ?? [],
        regions: data.regions ?? [],
        price: Number(data.price) || 0,
        freeAbove: data.freeAbove ?? null,
        isActive: data.isActive ?? true,
      },
    });
  }

  async updateZone(
    id: string,
    data: {
      name?: string;
      cities?: string[];
      regions?: string[];
      price?: number;
      freeAbove?: number | null;
      isActive?: boolean;
    },
  ) {
    await this.getZone(id);
    return this.prisma.shippingZone.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: String(data.name).trim() }),
        ...(data.cities !== undefined && { cities: data.cities }),
        ...(data.regions !== undefined && { regions: data.regions }),
        ...(data.price !== undefined && { price: Number(data.price) || 0 }),
        ...(data.freeAbove !== undefined && { freeAbove: data.freeAbove }),
        ...(data.isActive !== undefined && { isActive: Boolean(data.isActive) }),
      },
    });
  }

  async deleteZone(id: string) {
    await this.getZone(id);
    return this.prisma.shippingZone.delete({ where: { id } });
  }
}

@Injectable()
export class AmanaService {
  private readonly logger = new Logger(AmanaService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async createShipment(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { shipment: true, payment: true },
    });
    if (!order) throw new NotFoundException('Commande introuvable');
    if (order.shipment?.trackingNumber) return order.shipment;

    const address = order.shippingAddress as {
      firstName: string;
      lastName: string;
      phone: string;
      addressLine1: string;
      city: string;
    };

    const apiUrl = this.config.get('AMANA_API_URL', '');
    const apiKey = this.config.get('AMANA_API_KEY', '');
    const isCod = order.payment?.method === 'COD';

    let trackingNumber: string;
    let amanaParcelId: string;
    let labelUrl: string | undefined;

    if (apiKey && apiUrl) {
      const res = await fetch(`${apiUrl}/parcels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          sender: {
            name: this.config.get('AMANA_SENDER_NAME'),
            phone: this.config.get('AMANA_SENDER_PHONE'),
            address: this.config.get('AMANA_SENDER_ADDRESS'),
          },
          recipient: {
            name: `${address.firstName} ${address.lastName}`,
            phone: address.phone,
            address: address.addressLine1,
            city: address.city,
          },
          cod: isCod ? order.total : 0,
          value: order.total,
          reference: order.orderNumber,
        }),
      });
      if (!res.ok) {
        this.logger.error(`Amana API: ${await res.text()}`);
        throw new Error('Échec création colis Amana');
      }
      const data = (await res.json()) as {
        tracking_number: string;
        id: string;
        label_url?: string;
      };
      trackingNumber = data.tracking_number;
      amanaParcelId = data.id;
      labelUrl = data.label_url;
    } else {
      this.logger.warn('Amana mock mode');
      trackingNumber = `AMN-${Date.now().toString(36).toUpperCase()}`;
      amanaParcelId = `mock-${orderId.slice(0, 8)}`;
    }

    return this.prisma.shipment.update({
      where: { orderId },
      data: {
        trackingNumber,
        amanaParcelId,
        labelUrl,
        status: 'LABEL_CREATED',
        codAmount: isCod ? order.total : null,
        shippingZone: address.city,
      },
    });
  }

  async syncStatus(trackingNumber: string) {
    const apiUrl = this.config.get('AMANA_API_URL', '');
    const apiKey = this.config.get('AMANA_API_KEY', '');
    if (!apiKey) return null;

    const res = await fetch(`${apiUrl}/parcels/${trackingNumber}/status`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as { status: string };
    const statusMap: Record<string, string> = {
      picked_up: 'PICKED_UP',
      in_transit: 'IN_TRANSIT',
      out_for_delivery: 'OUT_FOR_DELIVERY',
      delivered: 'DELIVERED',
      returned: 'RETURNED',
    };

    const mapped = statusMap[data.status.toLowerCase()];
    if (!mapped) return null;

    const shipment = await this.prisma.shipment.update({
      where: { trackingNumber },
      data: {
        status: mapped as never,
        deliveredAt: mapped === 'DELIVERED' ? new Date() : undefined,
      },
    });

    if (mapped === 'DELIVERED') {
      await this.prisma.order.update({
        where: { id: shipment.orderId },
        data: { status: 'DELIVERED' },
      });
    }

    return shipment;
  }

  async trackForCustomer(orderNumber: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: {
        shipment: true,
        payment: true,
        items: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!order) throw new NotFoundException('Commande introuvable');

    if (order.shipment?.trackingNumber) {
      await this.syncStatus(order.shipment.trackingNumber).catch(() => {});
      const refreshed = await this.prisma.order.findUnique({
        where: { orderNumber },
        include: {
          shipment: true,
          payment: true,
          items: true,
          statusHistory: { orderBy: { createdAt: 'desc' } },
        },
      });
      return refreshed;
    }

    return order;
  }
}
