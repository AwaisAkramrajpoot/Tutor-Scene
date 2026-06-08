import { IsEnum, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum SessionStatus {
  UPCOMING = 'upcoming',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum UpcomingViewMode {
  COUNT = 'count',
  PERIOD = 'period',
}

export enum UpcomingPeriod {
  WEEK = 'week',
  MONTH = 'month',
  THREE_MONTHS = '3months',
}

export class GetStudentSessionsQueryDto {
  @ApiProperty({
    enum: SessionStatus,
    description: 'Filter sessions by status',
    required: true,
  })
  @IsEnum(SessionStatus)
  status: SessionStatus;

  @ApiProperty({
    description: 'Page number (starts from 1)',
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    required: false,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiProperty({
    enum: UpcomingViewMode,
    required: false,
    default: UpcomingViewMode.COUNT,
    description: 'Upcoming filter mode: count (next N) or period (time window)',
  })
  @IsOptional()
  @IsEnum(UpcomingViewMode)
  viewMode?: UpcomingViewMode = UpcomingViewMode.COUNT;

  @ApiProperty({
    enum: UpcomingPeriod,
    required: false,
    description: 'Time window when viewMode is period',
  })
  @IsOptional()
  @IsEnum(UpcomingPeriod)
  period?: UpcomingPeriod;
}
