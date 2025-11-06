import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { InterviewStatus } from '@/database/entities/enums';

export class GetInterviewsQueryDto {
  @ApiPropertyOptional({
    description: 'Filter interviews by status',
    enum: InterviewStatus,
    example: InterviewStatus.SCHEDULED,
  })
  @IsOptional()
  @IsEnum(InterviewStatus)
  status?: InterviewStatus;
}
