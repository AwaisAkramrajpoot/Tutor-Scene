import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateInterviewQuestionDto {
  @ApiProperty({ example: 'A' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(8)
  optionKey: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
