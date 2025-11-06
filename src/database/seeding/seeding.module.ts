import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { SeedingService } from './seeding.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [SeedingService],
  exports: [SeedingService],
})
export class SeedingModule {}
