import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsDateString, IsString, IsOptional, Min } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  studentProfileId: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  tutorProfileId: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  subjectId: number;

  @ApiProperty({ example: '2025-01-15T10:00:00Z' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ example: '2025-01-15T11:00:00Z' })
  @IsDateString()
  endTime: string;

  @ApiProperty({ example: 50.00, description: 'Total price for the booking session' })
  @IsNumber()
  @Min(0)
  totalPrice: number;

  @ApiProperty({ example: 'I need help with calculus', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ example: 'SAVE20', required: false, description: 'Discount coupon code' })
  @IsString()
  @IsOptional()
  discountCode?: string;

  @ApiProperty({ example: 'Emma', required: false, description: 'Learner label for multi-learner accounts' })
  @IsString()
  @IsOptional()
  learnerLabel?: string;
}
