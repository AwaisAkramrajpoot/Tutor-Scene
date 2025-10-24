import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class InitiateBackgroundCheckDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  tutorProfileId: number;
}
