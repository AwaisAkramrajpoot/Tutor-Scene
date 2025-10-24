import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '@/database/entities/user.entity';
import { Booking } from '@/database/entities/booking.entity';
import { Payment } from '@/database/entities/payment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Booking, Payment])],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
