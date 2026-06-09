import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { Booking } from '@/database/entities/booking.entity';
import { User } from '@/database/entities/user.entity';
import { Prospect } from '@/database/entities/prospect.entity';
import { Payment } from '@/database/entities/payment.entity';
import { Review } from '@/database/entities/review.entity';
import { PlatformSettings } from '@/database/entities/platform-settings.entity';
import { StripeService } from './services/stripe.service';
import { InterviewsModule } from '../interviews/interviews.module';
import { AuthModule } from '../auth/auth.module';
import { PromoCodesModule } from '../promo-codes/promo-codes.module';
import { NotificationsModule } from '../notifications/notifications.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, User, Prospect, Payment, Review, PlatformSettings]),
    forwardRef(() => InterviewsModule),
    AuthModule,
    PromoCodesModule,
    NotificationsModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService, StripeService, BookingsSchedulerService],
  exports: [BookingsService],
})
export class BookingsModule {}
