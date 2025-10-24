import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class CreateVideoSessionDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  bookingId: number;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  recordingConsent?: boolean;
}
