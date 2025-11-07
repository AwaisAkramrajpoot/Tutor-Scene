import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromoCodesController } from './promo-codes.controller';
import { PromoCodesService } from './promo-codes.service';
import { PromoCode } from '@/database/entities/promo-code.entity';
import { StripeService } from '../bookings/services/stripe.service';

@Module({
  imports: [TypeOrmModule.forFeature([PromoCode])],
  controllers: [PromoCodesController],
  providers: [PromoCodesService, StripeService],
  exports: [PromoCodesService],
})
export class PromoCodesModule {}
