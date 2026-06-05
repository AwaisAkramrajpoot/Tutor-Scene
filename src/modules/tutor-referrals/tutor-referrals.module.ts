import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@/database/entities/user.entity';
import { Referral } from '@/database/entities/referral.entity';
import { ReferralProgramSettings } from '@/database/entities/referral-program-settings.entity';
import { TutorReferralsService } from './tutor-referrals.service';
import { TutorReferralsController } from './tutor-referrals.controller';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Referral, ReferralProgramSettings]),
  ],
  controllers: [TutorReferralsController],
  providers: [TutorReferralsService, RolesGuard],
  exports: [TutorReferralsService],
})
export class TutorReferralsModule {}
