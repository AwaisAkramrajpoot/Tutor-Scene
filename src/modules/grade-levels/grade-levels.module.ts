import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GradeLevel } from '@/database/entities/grade-level.entity';
import { GradeLevelsController } from './grade-levels.controller';
import { GradeLevelsService } from './grade-levels.service';

@Module({
  imports: [TypeOrmModule.forFeature([GradeLevel])],
  controllers: [GradeLevelsController],
  providers: [GradeLevelsService],
  exports: [GradeLevelsService],
})
export class GradeLevelsModule {}
