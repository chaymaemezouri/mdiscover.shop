import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ShippingService, AmanaService } from './shipping.service';
import { AdminAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('shipping')
@Controller('shipping')
export class ShippingController {
  constructor(
    private shipping: ShippingService,
    private amana: AmanaService,
  ) {}

  @Get('calculate')
  @ApiOperation({ summary: 'Calculer les frais de livraison' })
  calculate(@Query('city') city: string, @Query('subtotal') subtotal: number) {
    return this.shipping.calculateShipping(city, Number(subtotal) || 0);
  }

  @Get('zones')
  @ApiOperation({ summary: 'Zones de livraison' })
  zones() {
    return this.shipping.getZones();
  }

  @Get('track/:orderNumber')
  @ApiOperation({ summary: 'Suivi commande par numéro' })
  track(@Param('orderNumber') orderNumber: string) {
    return this.amana.trackForCustomer(orderNumber);
  }
}

@ApiTags('admin')
@Controller('admin/shipments')
@UseGuards(AdminAuthGuard)
@ApiBearerAuth()
export class AdminShipmentsController {
  constructor(private amana: AmanaService) {}

  @Post(':orderId/create')
  @ApiOperation({ summary: 'Créer un colis Amana pour une commande' })
  create(@Param('orderId') orderId: string) {
    return this.amana.createShipment(orderId);
  }

  @Post('sync/:trackingNumber')
  @ApiOperation({ summary: 'Synchroniser le statut Amana' })
  sync(@Param('trackingNumber') trackingNumber: string) {
    return this.amana.syncStatus(trackingNumber);
  }
}
