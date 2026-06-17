import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvailabilityController } from './availability.controller';
import { AvailabilityService } from './availability.service';
import { AvailabilitySlot } from '@/database/entities/availability-slot.entity';
import { Booking } from '@/database/entities/booking.entity';
import { Prospect } from '@/database/entities/prospect.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AvailabilitySlot, Booking, Prospect])],
  controllers: [AvailabilityController],
  providers: [AvailabilityService],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}
