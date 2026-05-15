import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LearnerAssessmentResponse } from '@/database/entities/learner-assessment-response.entity';
import { LearnerAssessmentService } from './learner-assessment.service';
import { LearnerAssessmentController } from './learner-assessment.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LearnerAssessmentResponse]),
    AuthModule,
  ],
  controllers: [LearnerAssessmentController],
  providers: [LearnerAssessmentService],
  exports: [LearnerAssessmentService],
})
export class LearnerAssessmentModule {}
