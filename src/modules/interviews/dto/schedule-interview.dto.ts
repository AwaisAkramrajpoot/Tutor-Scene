import { IsNumber, IsNotEmpty, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ScheduleInterviewDto {
  @ApiProperty({
    description: 'The ID of the user (prospect) to schedule an interview for',
    example: 123,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({
    description: 'The scheduled start time of the interview in ISO 8601 format',
    example: '2024-01-15T10:00:00Z',
    type: String,
  })
  @IsDateString()
  @IsNotEmpty()
  startTime: string; // ISO 8601 format
}
