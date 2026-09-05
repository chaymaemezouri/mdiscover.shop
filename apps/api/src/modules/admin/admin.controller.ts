import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { AdminService } from './admin.service';
import { AdminProductsService } from './admin-products.service';
import { AdminOrdersService } from './admin-orders.service';
import { AdminCouponsService } from './admin-coupons.service';
import { AdminCustomersService } from './admin-customers.service';
import { AdminCmsService } from './admin-cms.service';
import { AdminSettingsService } from './admin-settings.service';
import { AdminCategoriesService } from './admin-categories.service';
import { AdminBrandsService } from './admin-brands.service';
import { AdminContactService } from './admin-contact.service';
import { AdminAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, ADMIN_ROLE_GROUPS } from '../auth/decorators/roles.decorator';
import { CreateProductDto, UpdateProductDto, UpdateOrderStatusDto } from './dto/admin.dto';
import { AdminTwoFactorService } from './admin-two-factor.service';
import { ShippingService } from '../shipping/shipping.service';

@ApiTags('admin')
@Controller('admin')
@UseGuards(AdminAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private adminService: AdminService,
    private productsService: AdminProductsService,
    private ordersService: AdminOrdersService,
    private couponsService: AdminCouponsService,
    private customersService: AdminCustomersService,
    private cmsService: AdminCmsService,
    private settingsService: AdminSettingsService,
    private twoFactorService: AdminTwoFactorService,
    private categoriesService: AdminCategoriesService,
    private brandsService: AdminBrandsService,
    private shippingService: ShippingService,
    private contactService: AdminContactService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Profil admin connecté' })
  me(@Req() req: { user: { id: string; email: string; role: string; firstName: string; lastName: string; twoFactorEnabled: boolean } }) {
    return {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      twoFactorEnabled: req.user.twoFactorEnabled,
    };
  }

  @Put('me')
  @ApiOperation({ summary: 'Modifier profil admin' })
  updateMe(
    @Req() req: { user: { id: string } },
    @Body() body: { email?: string; firstName?: string; lastName?: string },
  ) {
    return this.adminService.updateProfile(req.user.id, body);
  }

  @Put('me/password')
  @ApiOperation({ summary: 'Changer mot de passe admin' })
  changeMyPassword(
    @Req() req: { user: { id: string } },
    @Body() body: { currentPassword?: string; newPassword?: string },
  ) {
    return this.adminService.changePassword(
      req.user.id,
      String(body.currentPassword ?? ''),
      String(body.newPassword ?? ''),
    );
  }

  @Get('dashboard')
  @Roles(...ADMIN_ROLE_GROUPS.all)
  @ApiOperation({ summary: 'Statistiques tableau de bord' })
  dashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('analytics')
  @Roles(...ADMIN_ROLE_GROUPS.analytics)
  @ApiOperation({ summary: 'Statistiques analytiques' })
  analytics(@Query('days') days?: number) {
    return this.adminService.getAnalytics(days);
  }

  // ─── 2FA ────────────────────────────────────────────────
  @Post('2fa/setup')
  @Roles(...ADMIN_ROLE_GROUPS.all)
  setup2fa(@Req() req: { user: { id: string } }) {
    return this.twoFactorService.setup(req.user.id);
  }

  @Post('2fa/enable')
  @Roles(...ADMIN_ROLE_GROUPS.all)
  enable2fa(@Req() req: { user: { id: string } }, @Body() body: { token: string }) {
    return this.twoFactorService.enable(req.user.id, body.token);
  }

  @Post('2fa/disable')
  @Roles(...ADMIN_ROLE_GROUPS.all)
  disable2fa(@Req() req: { user: { id: string } }, @Body() body: { token: string }) {
    return this.twoFactorService.disable(req.user.id, body.token);
  }

  // ─── Products ─────────────────────────────────────────────
  @Get('products/export/csv')
  @Roles(...ADMIN_ROLE_GROUPS.products)
  @ApiOperation({ summary: 'Exporter produits CSV' })
  async exportProducts(@Res() res: Response) {
    const csv = await this.productsService.exportCsv();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');
    res.send(csv);
  }

  @Post('products/import/csv')
  @Roles(...ADMIN_ROLE_GROUPS.products)
  @ApiOperation({ summary: 'Importer produits CSV' })
  importProducts(@Body() body: { csv: string }) {
    return this.productsService.importCsv(body.csv);
  }

  @Get('products')
  @Roles(...ADMIN_ROLE_GROUPS.products)
  @ApiOperation({ summary: 'Liste produits' })
  listProducts(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.productsService.findAll(page, limit, search, status, categoryId);
  }

  @Get('products/:id')
  @Roles(...ADMIN_ROLE_GROUPS.products)
  @ApiOperation({ summary: 'Détail produit' })
  getProduct(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post('products')
  @Roles(...ADMIN_ROLE_GROUPS.products)
  @ApiOperation({ summary: 'Créer un produit' })
  createProduct(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Put('products/:id')
  @Roles(...ADMIN_ROLE_GROUPS.products)
  @ApiOperation({ summary: 'Modifier un produit' })
  updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete('products/:id')
  @Roles(...ADMIN_ROLE_GROUPS.products)
  @ApiOperation({ summary: 'Supprimer un produit (soft delete)' })
  deleteProduct(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Post('products/:id/duplicate')
  @Roles(...ADMIN_ROLE_GROUPS.products)
  @ApiOperation({ summary: 'Dupliquer un produit' })
  duplicateProduct(@Param('id') id: string) {
    return this.productsService.duplicate(id);
  }

  // ─── Orders ─────────────────────────────────────────────
  @Get('orders')
  @Roles(...ADMIN_ROLE_GROUPS.ordersRead)
  @ApiOperation({ summary: 'Liste commandes' })
  listOrders(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('paymentStatus') paymentStatus?: string,
  ) {
    return this.ordersService.findAll(page, limit, status, search, paymentMethod, paymentStatus);
  }

  @Get('orders/:id')
  @Roles(...ADMIN_ROLE_GROUPS.ordersRead)
  @ApiOperation({ summary: 'Détail commande' })
  getOrder(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Get('orders/:id/invoice')
  @Roles(...ADMIN_ROLE_GROUPS.ordersRead)
  @ApiOperation({ summary: 'Facture HTML (impression)' })
  async orderInvoice(@Param('id') id: string, @Res() res: Response) {
    const html = await this.ordersService.getInvoiceHtml(id);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }

  @Put('orders/:id/status')
  @Roles(...ADMIN_ROLE_GROUPS.ordersWrite)
  @ApiOperation({ summary: 'Changer le statut d\'une commande' })
  updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @Req() req: { user: { id: string } },
  ) {
    return this.ordersService.updateStatus(id, dto, req.user.id);
  }

  @Put('orders/:id/notes')
  @Roles(...ADMIN_ROLE_GROUPS.ordersWrite)
  @ApiOperation({ summary: 'Notes internes commande' })
  updateOrderNotes(@Param('id') id: string, @Body() body: { notes?: string | null }) {
    return this.ordersService.updateNotes(id, body.notes ?? null);
  }

  // ─── Coupons ────────────────────────────────────────────
  @Get('coupons')
  @Roles(...ADMIN_ROLE_GROUPS.coupons)
  @ApiOperation({ summary: 'Liste des coupons' })
  listCoupons(
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('type') type?: string,
  ) {
    return this.couponsService.findAll(search, isActive, type);
  }

  @Get('coupons/:id')
  @Roles(...ADMIN_ROLE_GROUPS.coupons)
  @ApiOperation({ summary: 'Détail coupon' })
  getCoupon(@Param('id') id: string) {
    return this.couponsService.findOne(id);
  }

  @Post('coupons')
  @Roles(...ADMIN_ROLE_GROUPS.coupons)
  @ApiOperation({ summary: 'Créer un coupon' })
  createCoupon(@Body() body: Record<string, unknown>) {
    return this.couponsService.create(body as never);
  }

  @Put('coupons/:id')
  @Roles(...ADMIN_ROLE_GROUPS.coupons)
  @ApiOperation({ summary: 'Modifier un coupon' })
  updateCoupon(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.couponsService.update(id, body as never);
  }

  @Put('coupons/:id/toggle')
  @Roles(...ADMIN_ROLE_GROUPS.coupons)
  @ApiOperation({ summary: 'Activer/désactiver un coupon' })
  toggleCoupon(@Param('id') id: string) {
    return this.couponsService.toggle(id);
  }

  @Delete('coupons/:id')
  @Roles(...ADMIN_ROLE_GROUPS.coupons)
  @ApiOperation({ summary: 'Supprimer un coupon' })
  deleteCoupon(@Param('id') id: string) {
    return this.couponsService.remove(id);
  }

  // ─── Categories ─────────────────────────────────────────
  @Get('categories')
  @Roles(...ADMIN_ROLE_GROUPS.products)
  @ApiOperation({ summary: 'Liste catégories' })
  listCategories(@Query('search') search?: string, @Query('isActive') isActive?: string) {
    return this.categoriesService.findAll(search, isActive);
  }

  @Get('categories/:id')
  @Roles(...ADMIN_ROLE_GROUPS.products)
  @ApiOperation({ summary: 'Détail catégorie' })
  getCategory(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Post('categories')
  @Roles(...ADMIN_ROLE_GROUPS.products)
  @ApiOperation({ summary: 'Créer catégorie' })
  createCategory(@Body() body: Record<string, unknown>) {
    return this.categoriesService.create(body as never);
  }

  @Put('categories/:id')
  @Roles(...ADMIN_ROLE_GROUPS.products)
  @ApiOperation({ summary: 'Modifier catégorie' })
  updateCategory(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.categoriesService.update(id, body as never);
  }

  @Delete('categories/:id')
  @Roles(...ADMIN_ROLE_GROUPS.products)
  @ApiOperation({ summary: 'Supprimer catégorie' })
  deleteCategory(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }

  // ─── Brands ─────────────────────────────────────────────
  @Get('brands')
  @Roles(...ADMIN_ROLE_GROUPS.products)
  @ApiOperation({ summary: 'Liste marques' })
  listBrands(@Query('search') search?: string, @Query('isActive') isActive?: string) {
    return this.brandsService.findAll(search, isActive);
  }

  @Get('brands/:id')
  @Roles(...ADMIN_ROLE_GROUPS.products)
  @ApiOperation({ summary: 'Détail marque' })
  getBrand(@Param('id') id: string) {
    return this.brandsService.findOne(id);
  }

  @Post('brands')
  @Roles(...ADMIN_ROLE_GROUPS.products)
  @ApiOperation({ summary: 'Créer marque' })
  createBrand(@Body() body: Record<string, unknown>) {
    return this.brandsService.create(body);
  }

  @Put('brands/:id')
  @Roles(...ADMIN_ROLE_GROUPS.products)
  @ApiOperation({ summary: 'Modifier marque' })
  updateBrand(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.brandsService.update(id, body);
  }

  @Delete('brands/:id')
  @Roles(...ADMIN_ROLE_GROUPS.products)
  @ApiOperation({ summary: 'Supprimer marque' })
  deleteBrand(@Param('id') id: string) {
    return this.brandsService.remove(id);
  }

  // ─── Shipping zones ─────────────────────────────────────
  @Get('shipping/zones')
  @Roles(...ADMIN_ROLE_GROUPS.shipping)
  @ApiOperation({ summary: 'Zones de livraison' })
  listShippingZones(@Query('search') search?: string, @Query('isActive') isActive?: string) {
    return this.shippingService.adminListZones(search, isActive);
  }

  @Get('shipping/zones/:id')
  @Roles(...ADMIN_ROLE_GROUPS.shipping)
  @ApiOperation({ summary: 'Détail zone livraison' })
  getShippingZone(@Param('id') id: string) {
    return this.shippingService.getZone(id);
  }

  @Post('shipping/zones')
  @Roles(...ADMIN_ROLE_GROUPS.shipping)
  @ApiOperation({ summary: 'Créer zone livraison' })
  createShippingZone(@Body() body: Record<string, unknown>) {
    return this.shippingService.createZone(body as never);
  }

  @Put('shipping/zones/:id')
  @Roles(...ADMIN_ROLE_GROUPS.shipping)
  @ApiOperation({ summary: 'Modifier zone livraison' })
  updateShippingZone(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.shippingService.updateZone(id, body as never);
  }

  @Delete('shipping/zones/:id')
  @Roles(...ADMIN_ROLE_GROUPS.shipping)
  @ApiOperation({ summary: 'Supprimer zone livraison' })
  deleteShippingZone(@Param('id') id: string) {
    return this.shippingService.deleteZone(id);
  }

  // ─── Customers ──────────────────────────────────────────
  @Get('customers')
  @Roles(...ADMIN_ROLE_GROUPS.customersRead)
  @ApiOperation({ summary: 'Liste des clients' })
  listCustomers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.customersService.findAll(page, limit, search, status);
  }

  @Get('customers/:id')
  @Roles(...ADMIN_ROLE_GROUPS.customersRead)
  @ApiOperation({ summary: 'Détail client' })
  getCustomer(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Put('customers/:id/block')
  @Roles(...ADMIN_ROLE_GROUPS.customersWrite)
  @ApiOperation({ summary: 'Bloquer un client' })
  blockCustomer(@Param('id') id: string) {
    return this.customersService.block(id);
  }

  @Put('customers/:id/unblock')
  @Roles(...ADMIN_ROLE_GROUPS.customersWrite)
  @ApiOperation({ summary: 'Débloquer un client' })
  unblockCustomer(@Param('id') id: string) {
    return this.customersService.unblock(id);
  }

  // ─── CMS ────────────────────────────────────────────────
  @Get('cms/pages')
  @Roles(...ADMIN_ROLE_GROUPS.cms)
  @ApiOperation({ summary: 'Liste pages CMS' })
  listPages(@Query('search') search?: string, @Query('isPublished') isPublished?: string) {
    return this.cmsService.listPages(search, isPublished);
  }

  @Get('cms/pages/:id')
  @Roles(...ADMIN_ROLE_GROUPS.cms)
  @ApiOperation({ summary: 'Détail page CMS' })
  getPage(@Param('id') id: string) {
    return this.cmsService.getPage(id);
  }

  @Put('cms/pages/:id')
  @Roles(...ADMIN_ROLE_GROUPS.cms)
  @ApiOperation({ summary: 'Modifier page CMS' })
  updatePage(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.cmsService.updatePage(id, body);
  }

  @Get('cms/blog')
  @Roles(...ADMIN_ROLE_GROUPS.cms)
  @ApiOperation({ summary: 'Liste articles blog' })
  listBlogPosts(@Query('search') search?: string, @Query('isPublished') isPublished?: string) {
    return this.cmsService.listBlogPosts(search, isPublished);
  }

  @Get('cms/blog/:id')
  @Roles(...ADMIN_ROLE_GROUPS.cms)
  @ApiOperation({ summary: 'Détail article blog' })
  getBlogPost(@Param('id') id: string) {
    return this.cmsService.getBlogPost(id);
  }

  @Post('cms/blog')
  @Roles(...ADMIN_ROLE_GROUPS.cms)
  @ApiOperation({ summary: 'Créer article blog' })
  createBlogPost(@Body() body: Record<string, unknown>) {
    return this.cmsService.createBlogPost(body);
  }

  @Put('cms/blog/:id')
  @Roles(...ADMIN_ROLE_GROUPS.cms)
  @ApiOperation({ summary: 'Modifier article blog' })
  updateBlogPost(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.cmsService.updateBlogPost(id, body);
  }

  @Delete('cms/blog/:id')
  @Roles(...ADMIN_ROLE_GROUPS.cms)
  @ApiOperation({ summary: 'Supprimer article blog' })
  deleteBlogPost(@Param('id') id: string) {
    return this.cmsService.deleteBlogPost(id);
  }

  @Get('cms/banners')
  @Roles(...ADMIN_ROLE_GROUPS.cms)
  @ApiOperation({ summary: 'Liste bannières' })
  listBanners(@Query('isActive') isActive?: string) {
    return this.cmsService.listBanners(isActive);
  }

  @Get('cms/banners/:id')
  @Roles(...ADMIN_ROLE_GROUPS.cms)
  @ApiOperation({ summary: 'Détail bannière' })
  getBanner(@Param('id') id: string) {
    return this.cmsService.getBanner(id);
  }

  @Post('cms/banners')
  @Roles(...ADMIN_ROLE_GROUPS.cms)
  @ApiOperation({ summary: 'Créer bannière' })
  createBanner(@Body() body: Record<string, unknown>) {
    return this.cmsService.createBanner(body);
  }

  @Put('cms/banners/:id')
  @Roles(...ADMIN_ROLE_GROUPS.cms)
  @ApiOperation({ summary: 'Modifier bannière' })
  updateBanner(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.cmsService.updateBanner(id, body);
  }

  @Delete('cms/banners/:id')
  @Roles(...ADMIN_ROLE_GROUPS.cms)
  @ApiOperation({ summary: 'Supprimer bannière' })
  deleteBanner(@Param('id') id: string) {
    return this.cmsService.deleteBanner(id);
  }

  // ─── Contact messages ───────────────────────────────────
  @Get('contact-messages')
  @Roles(...ADMIN_ROLE_GROUPS.customersRead)
  @ApiOperation({ summary: 'Messages de contact' })
  listContactMessages(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.contactService.list(
      status,
      search,
      page ? Number(page) : 1,
      limit ? Number(limit) : 30,
    );
  }

  @Get('contact-messages/:id')
  @Roles(...ADMIN_ROLE_GROUPS.customersRead)
  @ApiOperation({ summary: 'Détail message contact' })
  getContactMessage(@Param('id') id: string) {
    return this.contactService.get(id);
  }

  @Put('contact-messages/:id/read')
  @Roles(...ADMIN_ROLE_GROUPS.customersWrite)
  @ApiOperation({ summary: 'Marquer message comme lu' })
  markContactRead(@Param('id') id: string, @Body() body: { isRead?: boolean }) {
    return this.contactService.markRead(id, body?.isRead !== false);
  }

  @Delete('contact-messages/:id')
  @Roles(...ADMIN_ROLE_GROUPS.customersWrite)
  @ApiOperation({ summary: 'Supprimer message contact' })
  deleteContactMessage(@Param('id') id: string) {
    return this.contactService.remove(id);
  }

  // ─── Settings ───────────────────────────────────────────
  @Get('settings')
  @Roles(...ADMIN_ROLE_GROUPS.settings)
  @ApiOperation({ summary: 'Paramètres du site' })
  getSettings() {
    return this.settingsService.getAll();
  }

  @Put('settings')
  @Roles(...ADMIN_ROLE_GROUPS.settings)
  @ApiOperation({ summary: 'Mettre à jour les paramètres' })
  updateSettings(@Body() body: Record<string, unknown>) {
    return this.settingsService.update(body as never);
  }
}
