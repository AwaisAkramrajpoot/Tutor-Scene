import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SubmitKYCDto {
  @ApiProperty({ example: 'PASSPORT' })
  @IsString()
  documentType: string;

  @ApiProperty({ example: 'https://s3.amazonaws.com/documents/passport.pdf' })
  @IsString()
  documentUrl: string;
}
