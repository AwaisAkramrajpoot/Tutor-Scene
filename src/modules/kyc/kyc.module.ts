import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';
import { KYC } from '@/database/entities/kyc.entity';

@Module({
  imports: [TypeOrmModule.forFeature([KYC])],
  controllers: [KycController],
  providers: [KycService],
  exports: [KycService],
})
export class KycModule {}
