import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InterviewsController } from './interviews.controller';
import { InterviewsService } from './interviews.service';
import { ZoomService } from './services/zoom.service';
import { Interview } from '@/database/entities/interview.entity';
import { VirtualInterviewResponse } from '@/database/entities/virtual-interview-response.entity';
import { InterviewTopic } from '@/database/entities/interview-topic.entity';
import { InterviewQuestion } from '@/database/entities/interview-question.entity';
import { Prospect } from '@/database/entities/prospect.entity';
import { User } from '@/database/entities/user.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Interview,
      Prospect,
      User,
      VirtualInterviewResponse,
      InterviewTopic,
      InterviewQuestion,
    ]),
    AuthModule,
  ],
  controllers: [InterviewsController],
  providers: [InterviewsService, ZoomService],
  exports: [InterviewsService, ZoomService],
})
export class InterviewsModule {}
