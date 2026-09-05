import { SetMetadata } from '@nestjs/common';
import { AdminRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: AdminRole[]) => SetMetadata(ROLES_KEY, roles);

export const ADMIN_ROLE_GROUPS = {
  products: ['SUPER_ADMIN', 'PRODUCT_MANAGER'] as AdminRole[],
  ordersRead: ['SUPER_ADMIN', 'ORDER_MANAGER', 'SUPPORT', 'ACCOUNTING'] as AdminRole[],
  ordersWrite: ['SUPER_ADMIN', 'ORDER_MANAGER'] as AdminRole[],
  coupons: ['SUPER_ADMIN', 'PRODUCT_MANAGER'] as AdminRole[],
  customersRead: ['SUPER_ADMIN', 'ORDER_MANAGER', 'SUPPORT'] as AdminRole[],
  customersWrite: ['SUPER_ADMIN', 'SUPPORT'] as AdminRole[],
  cms: ['SUPER_ADMIN', 'PRODUCT_MANAGER'] as AdminRole[],
  settings: ['SUPER_ADMIN'] as AdminRole[],
  shipping: ['SUPER_ADMIN', 'PRODUCT_MANAGER', 'ORDER_MANAGER'] as AdminRole[],
  analytics: ['SUPER_ADMIN', 'ACCOUNTING', 'ORDER_MANAGER'] as AdminRole[],
  all: ['SUPER_ADMIN', 'PRODUCT_MANAGER', 'ORDER_MANAGER', 'SUPPORT', 'ACCOUNTING'] as AdminRole[],
};
