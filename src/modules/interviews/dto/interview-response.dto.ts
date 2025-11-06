import { ApiProperty } from '@nestjs/swagger';
import { InterviewStatus } from '@/database/entities/enums';

export class InterviewResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the interview',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID of the user (prospect) being interviewed',
    example: 123,
  })
  userId: number;

  @ApiProperty({
    description: 'Scheduled start time of the interview',
    example: '2024-01-15T10:00:00Z',
  })
  startTime: Date;

  @ApiProperty({
    description: 'Zoom meeting ID',
    example: '123456789',
  })
  zoomMeetingId: string;

  @ApiProperty({
    description: 'URL for the admin to start the Zoom meeting',
    example: 'https://zoom.us/s/123456789?zak=...',
  })
  hostStartUrl: string;

  @ApiProperty({
    description: 'URL for the prospect to join the Zoom meeting',
    example: 'https://zoom.us/j/123456789',
  })
  participantJoinUrl: string;

  @ApiProperty({
    description: 'Password for the Zoom meeting',
    example: 'abc123',
  })
  meetingPassword: string;

  @ApiProperty({
    description: 'Current status of the interview',
    enum: InterviewStatus,
    example: InterviewStatus.SCHEDULED,
  })
  status: InterviewStatus;

  @ApiProperty({
    description: 'Timestamp when the interview was created',
    example: '2024-01-14T15:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the interview was last updated',
    example: '2024-01-14T15:30:00Z',
  })
  updatedAt: Date;
}
