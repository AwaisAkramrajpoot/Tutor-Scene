import { ApiProperty } from '@nestjs/swagger';

export class UploadFileDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'File to upload (JPEG, PNG, GIF, PDF)',
  })
  file: Express.Multer.File;
}
