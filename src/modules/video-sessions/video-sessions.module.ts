import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoSessionsController } from './video-sessions.controller';
import { VideoSessionsService } from './video-sessions.service';
import { VideoSession } from '@/database/entities/video-session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([VideoSession])],
  controllers: [VideoSessionsController],
  providers: [VideoSessionsService],
  exports: [VideoSessionsService],
})
export class VideoSessionsModule {}
