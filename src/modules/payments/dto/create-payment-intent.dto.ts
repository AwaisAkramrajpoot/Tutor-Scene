import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional } from 'class-validator';

export class CreatePaymentIntentDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  bookingId: number;

  @ApiProperty({ example: 50.00 })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: 'USD', required: false })
  @IsString()
  @IsOptional()
  currency?: string;
}
