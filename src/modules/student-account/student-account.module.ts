import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@/database/entities/user.entity';
import { LearnerAssessmentResponse } from '@/database/entities/learner-assessment-response.entity';
import { Booking } from '@/database/entities/booking.entity';
import { AuthModule } from '@/modules/auth/auth.module';
import { StudentAccountController } from './student-account.controller';
import { StudentAccountService } from './student-account.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, LearnerAssessmentResponse, Booking]),
    AuthModule,
  ],
  controllers: [StudentAccountController],
  providers: [StudentAccountService],
  exports: [StudentAccountService],
})
export class StudentAccountModule {}
