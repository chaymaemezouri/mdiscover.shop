import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard, AdminAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, ADMIN_ROLE_GROUPS } from '../auth/decorators/roles.decorator';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Get('product/:productId')
  @ApiOperation({ summary: 'Avis approuvés d\'un produit' })
  findByProduct(@Param('productId') productId: string) {
    return this.reviewsService.findByProduct(productId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Laisser un avis' })
  create(@Body() dto: CreateReviewDto, @Req() req: { user: { id: string } }) {
    return this.reviewsService.create(req.user.id, dto);
  }
}

@ApiTags('admin')
@Controller('admin/reviews')
@UseGuards(AdminAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Get('pending')
  @Roles(...ADMIN_ROLE_GROUPS.customersRead)
  pending() {
    return this.reviewsService.findPending();
  }

  @Put(':id/:status')
  @Roles(...ADMIN_ROLE_GROUPS.customersWrite)
  moderate(@Param('id') id: string, @Param('status') status: 'APPROVED' | 'REJECTED') {
    return this.reviewsService.moderate(id, status);
  }
}
