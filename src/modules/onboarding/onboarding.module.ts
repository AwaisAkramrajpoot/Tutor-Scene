import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './services/onboarding.service';
import { Prospect } from '@/database/entities/prospect.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Prospect]),
  ],
  controllers: [OnboardingController],
  providers: [OnboardingService],
  exports: [OnboardingService],
})
export class OnboardingModule {}