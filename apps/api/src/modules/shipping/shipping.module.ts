import { Module } from '@nestjs/common';
import { ShippingController, AdminShipmentsController } from './shipping.controller';
import { ShippingService, AmanaService } from './shipping.service';

@Module({
  controllers: [ShippingController, AdminShipmentsController],
  providers: [ShippingService, AmanaService],
  exports: [ShippingService, AmanaService],
})
export class ShippingModule {}
