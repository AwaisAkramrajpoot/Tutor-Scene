import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { NotificationType } from '@/database/entities/enums';

export class CreateNotificationDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  userId: number;

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ example: 'New booking request' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'You have a new booking request from John Doe' })
  @IsString()
  message: string;

  @ApiProperty({ example: 'EMAIL', required: false })
  @IsString()
  @IsOptional()
  channel?: string;

  @ApiProperty({ example: '/bookings/123', required: false })
  @IsString()
  @IsOptional()
  actionUrl?: string;
}
