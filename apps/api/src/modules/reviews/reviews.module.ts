import { Module } from '@nestjs/common';
import { ReviewsController, AdminReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  controllers: [ReviewsController, AdminReviewsController],
  providers: [ReviewsService, RolesGuard],
})
export class ReviewsModule {}
