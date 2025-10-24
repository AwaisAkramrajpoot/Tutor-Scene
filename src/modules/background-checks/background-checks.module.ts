import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BackgroundChecksController } from './background-checks.controller';
import { BackgroundChecksService } from './background-checks.service';
import { BackgroundCheck } from '@/database/entities/background-check.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BackgroundCheck])],
  controllers: [BackgroundChecksController],
  providers: [BackgroundChecksService],
  exports: [BackgroundChecksService],
})
export class BackgroundChecksModule {}
