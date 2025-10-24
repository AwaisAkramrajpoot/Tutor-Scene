import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ example: 2 })
  @IsNumber()
  receiverId: number;

  @ApiProperty({ example: 'Hi, when can we schedule the session?' })
  @IsString()
  content: string;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  bookingId?: number;

  @ApiProperty({ example: 'https://s3.amazonaws.com/file.pdf', required: false })
  @IsString()
  @IsOptional()
  attachmentUrl?: string;
}
