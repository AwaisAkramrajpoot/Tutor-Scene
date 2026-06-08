import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateTutorBookingSettingsDto {
  @ApiProperty({ example: false })
  @IsBoolean()
  autoAcceptBookingRequests: boolean;
}
