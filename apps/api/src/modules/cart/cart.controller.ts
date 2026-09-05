import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('cart')
@Controller('cart')
export class CartController {
  constructor(private cartService: CartService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Récupérer le panier' })
  @ApiHeader({ name: 'x-session-id', required: false })
  getCart(@Req() req: { user?: { id: string } }, @Headers('x-session-id') sessionId?: string) {
    return this.cartService.getOrCreateCart(req.user?.id, sessionId);
  }

  @Post('items')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Ajouter un article au panier' })
  addItem(
    @Req() req: { user?: { id: string } },
    @Headers('x-session-id') sessionId: string,
    @Body() dto: AddToCartDto,
  ) {
    return this.cartService.getOrCreateCart(req.user?.id, sessionId).then((cart) =>
      this.cartService.addItem(cart.id, dto),
    );
  }

  @Patch('items/:itemId')
  @ApiOperation({ summary: 'Modifier la quantité' })
  updateItem(
    @Headers('x-cart-id') cartId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(cartId, itemId, dto);
  }

  @Delete('items/:itemId')
  @ApiOperation({ summary: 'Supprimer un article' })
  removeItem(@Headers('x-cart-id') cartId: string, @Param('itemId') itemId: string) {
    return this.cartService.removeItem(cartId, itemId);
  }
}
