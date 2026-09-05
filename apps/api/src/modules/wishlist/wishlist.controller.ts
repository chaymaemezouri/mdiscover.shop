import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('wishlist')
@Controller('wishlist')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WishlistController {
  constructor(private wishlistService: WishlistService) {}

  @Get()
  @ApiOperation({ summary: 'Ma liste de souhaits' })
  getItems(@Req() req: { user: { id: string } }) {
    return this.wishlistService.getItems(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Ajouter à la wishlist' })
  add(@Req() req: { user: { id: string } }, @Body('productId') productId: string) {
    return this.wishlistService.add(req.user.id, productId);
  }

  @Delete(':productId')
  @ApiOperation({ summary: 'Retirer de la wishlist' })
  remove(@Req() req: { user: { id: string } }, @Param('productId') productId: string) {
    return this.wishlistService.remove(req.user.id, productId);
  }
}
