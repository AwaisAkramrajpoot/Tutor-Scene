import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class CreateNotificationDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  userId: number;

  @ApiProperty({ example: 'You have a new booking request from John Doe' })
  @IsString()
  notification: string;

  @ApiPropertyOptional({ example: 'Booking Confirmation' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Your Chemistry session has been confirmed.' })
  @IsOptional()
  @IsString()
  preview?: string;

  @ApiPropertyOptional({ example: 'booking_confirmation' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
