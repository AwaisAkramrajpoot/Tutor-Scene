import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { Booking } from '@/database/entities/booking.entity';
import { User } from '@/database/entities/user.entity';
import { Prospect } from '@/database/entities/prospect.entity';
import { StripeService } from './services/stripe.service';
import { InterviewsModule } from '../interviews/interviews.module';
import { AuthModule } from '../auth/auth.module';
import { PromoCodesModule } from '../promo-codes/promo-codes.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, User, Prospect]),
    forwardRef(() => InterviewsModule),
    AuthModule,
    PromoCodesModule,
    NotificationsModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService, StripeService],
  exports: [BookingsService],
})
export class BookingsModule {}
