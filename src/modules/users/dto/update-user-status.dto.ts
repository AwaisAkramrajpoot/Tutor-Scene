import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UserStatus } from '@/database/entities/enums';

export class UpdateUserStatusDto {
  @ApiProperty({ 
    enum: UserStatus, 
    example: UserStatus.SUSPENDED,
    description: 'User status'
  })
  @IsEnum(UserStatus)
  status: UserStatus;

  @ApiProperty({ 
    example: 'Violated terms of service',
    required: false,
    description: 'Reason for suspension (required when status is suspended)'
  })
  @IsString()
  @IsOptional()
  suspensionReason?: string;
}
