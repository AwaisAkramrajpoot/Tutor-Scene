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
}