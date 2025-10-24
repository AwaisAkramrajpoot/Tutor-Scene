import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  bookingId: number;

  @ApiProperty({ example: 2 })
  @IsNumber()
  tutorProfileId: number;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ example: 'Great tutor! Very helpful and patient.', required: false })
  @IsString()
  @IsOptional()
  comment?: string;
}
