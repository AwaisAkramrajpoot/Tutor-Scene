import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CalendarSlotsQueryDto {
  @ApiPropertyOptional({ description: 'Tutor prospect ID for booking overlap checks' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  tutorProspectId?: number;

  @ApiPropertyOptional({ description: 'Current learner user ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  studentId?: number;

  @ApiPropertyOptional({ description: 'Range start (ISO date)' })
  @IsOptional()
  @IsString()
  start?: string;

  @ApiPropertyOptional({ description: 'Range end (ISO date)' })
  @IsOptional()
  @IsString()
  end?: string;
}
