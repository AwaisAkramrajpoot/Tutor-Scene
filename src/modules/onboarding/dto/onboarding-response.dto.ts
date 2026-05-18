import { Prospect } from '@/database/entities/prospect.entity';
import { ApiProperty } from '@nestjs/swagger';

export class OnboardingResponseDto {
  @ApiProperty({
    description: 'The prospect entity',
    type: () => Prospect
  })
  prospect: Prospect;

  @ApiProperty({
    description: 'Response message',
    example: 'Tutor onboarding initiated successfully'
  })
  message: string;

  @ApiProperty({
    description: 'Published (live) prospect id for student-facing profile',
    required: false,
  })
  publishedProspectId?: number;

  @ApiProperty({
    description: 'True when changes are saved as a pending draft after approval',
    required: false,
  })
  hasPendingProfileUpdate?: boolean;
}