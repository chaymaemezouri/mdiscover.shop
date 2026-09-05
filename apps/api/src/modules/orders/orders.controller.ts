import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Créer une commande' })
  create(@Body() dto: CreateOrderDto, @Req() req: { user?: { id: string } }) {
    return this.ordersService.create(dto, req.user?.id);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mes commandes' })
  myOrders(@Req() req: { user: { id: string } }) {
    return this.ordersService.findByUser(req.user.id);
  }

  @Get(':orderNumber')
  @ApiOperation({ summary: 'Suivi commande par numéro' })
  findOne(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.findByOrderNumber(orderNumber);
  }
}
