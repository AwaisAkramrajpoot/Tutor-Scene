import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber } from 'class-validator';

export class CreateAvailabilitySlotDto {
  @ApiProperty({ example: 8, description: 'Tutor profile ID' })
  @IsNumber()
  tutorProfileId: number;

  @ApiProperty({ example: '2025-11-06T00:00:00', description: 'Start time as ISO 8601 timestamp' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ example: '2025-11-06T01:00:00', description: 'End time as ISO 8601 timestamp' })
  @IsDateString()
  endTime: string;
}
