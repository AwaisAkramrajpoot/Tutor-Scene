import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { TicketPriority } from '@/database/entities/enums';

export class CreateTicketDto {
  @ApiProperty({ example: 'Unable to make payment' })
  @IsString()
  subject: string;

  @ApiProperty({ example: 'I am getting an error when trying to pay for my booking' })
  @IsString()
  description: string;

  @ApiProperty({ enum: TicketPriority, required: false })
  @IsEnum(TicketPriority)
  @IsOptional()
  priority?: TicketPriority;

  @ApiProperty({ example: 'BILLING', required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ example: 'https://s3.amazonaws.com/screenshots/error.png', required: false })
  @IsString()
  @IsOptional()
  attachmentUrl?: string;
}
