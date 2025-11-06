import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, Max, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchMessagesDto {
  @ApiProperty({ 
    example: 'math homework',
    description: 'Search query to find in message content',
    minLength: 1
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  query: string;

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
    example: 20,
    description: 'Number of search results per page',
    required: false,
    minimum: 1,
    maximum: 100,
    default: 20
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;
}
