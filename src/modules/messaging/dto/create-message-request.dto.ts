import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateMessageRequestDto {
  @ApiProperty({ 
    example: 5, 
    description: 'ID of the tutor to send message request to' 
  })
  @IsNumber()
  tutorId: number;

  @ApiProperty({ 
    example: 'Hi, I would like to discuss tutoring for Math.',
    description: 'Optional initial message to send with the request',
    required: false,
    maxLength: 500
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  message?: string;
}
