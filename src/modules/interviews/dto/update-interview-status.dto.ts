import { IsEnum, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InterviewStatus } from '@/database/entities/enums';

export class UpdateInterviewStatusDto {
  @ApiProperty({
    description: 'New status for the interview. Valid transitions: scheduled → completed, scheduled → cancelled',
    enum: InterviewStatus,
    example: InterviewStatus.COMPLETED,
  })
  @IsEnum(InterviewStatus)
  @IsIn([InterviewStatus.COMPLETED, InterviewStatus.CANCELLED])
  status: InterviewStatus;
}
