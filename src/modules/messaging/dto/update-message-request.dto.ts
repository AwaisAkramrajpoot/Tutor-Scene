import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum MessageRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export class UpdateMessageRequestDto {
  @ApiProperty({ 
    example: 'accepted',
    description: 'Status to update the message request to',
    enum: MessageRequestStatus
  })
  @IsEnum(MessageRequestStatus)
  status: MessageRequestStatus;
}
