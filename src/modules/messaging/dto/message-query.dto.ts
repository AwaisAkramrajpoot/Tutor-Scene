import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class MessageQueryDto {
  @ApiProperty({ 
    example: 1,
    description: 'Page number for pagination',
    required: false,
    minimum: 1,
    default: 1
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({ 
    example: 50,
    description: 'Number of messages per page',
    required: false,
    minimum: 1,
    maximum: 100,
    default: 50
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 50;
}
