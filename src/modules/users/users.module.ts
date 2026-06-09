import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../database/entities/user.entity';
import { Prospect } from '../../database/entities/prospect.entity';
import { LearnerAssessmentResponse } from '../../database/entities/learner-assessment-response.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MailService } from '../auth/services/mail.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Prospect, LearnerAssessmentResponse])],
  controllers: [UsersController],
  providers: [UsersService, MailService],
  exports: [UsersService],
})
export class UsersModule {}