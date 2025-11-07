import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ReviewStatus } from '@/database/entities/enums';

export class UpdateReviewStatusDto {
  @ApiProperty({ 
    enum: ReviewStatus, 
    example: ReviewStatus.APPROVED,
    description: 'Review status (approved or rejected)'
  })
  @IsEnum(ReviewStatus)
  status: ReviewStatus;
}
