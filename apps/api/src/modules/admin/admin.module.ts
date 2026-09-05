import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminProductsService } from './admin-products.service';
import { AdminOrdersService } from './admin-orders.service';
import { AdminCouponsService } from './admin-coupons.service';
import { AdminCustomersService } from './admin-customers.service';
import { AdminCmsService } from './admin-cms.service';
import { AdminSettingsService } from './admin-settings.service';
import { AdminTwoFactorService } from './admin-two-factor.service';
import { AdminCategoriesService } from './admin-categories.service';
import { AdminBrandsService } from './admin-brands.service';
import { AdminContactService } from './admin-contact.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { StorageModule } from '../storage/storage.module';
import { ShippingModule } from '../shipping/shipping.module';

@Module({
  imports: [StorageModule, ShippingModule],
  controllers: [AdminController],
  providers: [
    AdminService,
    AdminProductsService,
    AdminOrdersService,
    AdminCouponsService,
    AdminCustomersService,
    AdminCmsService,
    AdminSettingsService,
    AdminTwoFactorService,
    AdminCategoriesService,
    AdminBrandsService,
    AdminContactService,
    RolesGuard,
  ],
  exports: [AdminSettingsService],
})
export class AdminModule {}
