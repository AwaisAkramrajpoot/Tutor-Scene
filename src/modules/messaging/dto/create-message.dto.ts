import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsOptional, IsUrl } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({ 
    example: 'Hello! I have a question about the upcoming session.',
    description: 'Content of the message',
    maxLength: 5000
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content: string;

  @ApiProperty({ 
    example: 'https://s3.amazonaws.com/tutorscene/attachments/file.pdf',
    description: 'Optional URL to an attachment',
    required: false
  })
  @IsString()
  @IsOptional()
  @IsUrl()
  attachmentUrl?: string;
}
