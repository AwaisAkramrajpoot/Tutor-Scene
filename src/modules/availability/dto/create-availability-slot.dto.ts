import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, IsDateString } from 'class-validator';

export class CreateAvailabilitySlotDto {
  @ApiProperty({ example: 'MONDAY' })
  @IsString()
  dayOfWeek: string;

  @ApiProperty({ example: '09:00:00' })
  @IsString()
  startTime: string;

  @ApiProperty({ example: '17:00:00' })
  @IsString()
  endTime: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @ApiProperty({ example: '2024-06-15', required: false })
  @IsDateString()
  @IsOptional()
  specificDate?: string;
}
