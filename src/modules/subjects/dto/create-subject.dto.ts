import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

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

  @ApiProperty({ example: ['High', 'College'], required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  gradeLevels?: string[];
}
