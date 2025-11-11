import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refreshToken: string;

  @ApiProperty({ 
    example: { 
      id: 1, 
      email: 'john.doe@example.com', 
      firstName: 'John', 
      lastName: 'Doe', 
      role: 'tutor',
      status: 'active',
      paymentOnBoarded: true, 
      prospectId: 5,
      prospectStatus: 'awaiting_interview'
    } 
  })
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    status: string;
    paymentOnBoarded?: boolean;
    prospectId?: number;
    prospectStatus?: string;
  };
}
