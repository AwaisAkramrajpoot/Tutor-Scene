import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { Payment } from '@/database/entities/payment.entity';
import { TutorReferralsModule } from '../tutor-referrals/tutor-referrals.module';

@Module({
  imports: [TypeOrmModule.forFeature([Payment]), TutorReferralsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
