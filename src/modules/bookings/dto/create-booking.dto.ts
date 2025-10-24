import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsDateString, IsString, IsOptional } from 'class-validator';

export class CreateBookingDto {
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

  @ApiProperty({ example: 'America/New_York' })
  @IsString()
  timezone: string;

  @ApiProperty({ example: 'I need help with calculus', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
