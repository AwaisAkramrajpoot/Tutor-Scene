import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './services/onboarding.service';
import { Prospect } from '@/database/entities/prospect.entity';
import { User } from '@/database/entities/user.entity';
import { AvailabilitySlot } from '@/database/entities/availability-slot.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Prospect, User, AvailabilitySlot]),
    AuthModule,
  ],
  controllers: [OnboardingController],
  providers: [OnboardingService],
  exports: [OnboardingService],
})
export class OnboardingModule {}