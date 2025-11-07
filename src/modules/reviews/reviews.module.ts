import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { Review } from '@/database/entities/review.entity';
import { Booking } from '@/database/entities/booking.entity';
import { Prospect } from '@/database/entities/prospect.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Review, Booking, Prospect])],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
