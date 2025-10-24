import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateSubjectDto {
  @ApiProperty({ example: 'Mathematics' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Elementary to Advanced Mathematics', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'STEM', required: false })
  @IsString()
  @IsOptional()
  category?: string;
}
