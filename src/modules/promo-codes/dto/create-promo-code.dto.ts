import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsDateString, IsOptional } from 'class-validator';
import { PromoCodeDiscountType } from '@/database/entities/enums';

export class CreatePromoCodeDto {
  @ApiProperty({ example: 'WELCOME10' })
  @IsString()
  code: string;

  @ApiProperty({ enum: PromoCodeDiscountType })
  @IsEnum(PromoCodeDiscountType)
  discountType: PromoCodeDiscountType;

  @ApiProperty({ example: 10 })
  @IsNumber()
  discountValue: number;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  @IsDateString()
  validFrom: string;

  @ApiProperty({ example: '2024-12-31T23:59:59Z' })
  @IsDateString()
  validUntil: string;

  @ApiProperty({ example: 100, required: false })
  @IsNumber()
  @IsOptional()
  usageLimit?: number;

  @ApiProperty({ example: 50, required: false })
  @IsNumber()
  @IsOptional()
  minBookingAmount?: number;

  @ApiProperty({ example: 'FIRST_TIME_USERS', required: false })
  @IsString()
  @IsOptional()
  applicableTo?: string;
}
