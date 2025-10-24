import { IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum FileType {
  CV = 'cv',
  INTRO_VIDEO = 'introVideo',
  GOV_ID = 'govId',
}

export class FileUploadDto {
  @ApiProperty({
    description: 'Type of file being uploaded',
    enum: FileType,
    example: 'cv'
  })
  @IsEnum(FileType)
  fileType: FileType;

  @ApiProperty({
    description: 'Name of the file',
    example: 'my-cv.pdf'
  })
  @IsString()
  fileName: string;
}