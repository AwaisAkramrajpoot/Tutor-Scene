import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsEnum, IsOptional, IsString } from 'class-validator';
import { OnDemandContentType } from '@/database/entities/on-demand-content.entity';

export class QueryOnDemandContentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gradeLevel?: string;

  @ApiPropertyOptional({ description: 'under_15 | 15_30 | over_30' })
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiPropertyOptional({ description: 'under_5 | 5_10 | over_10' })
  @IsOptional()
  @IsString()
  price?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fileType?: string;

  @ApiPropertyOptional({ enum: OnDemandContentType })
  @IsOptional()
  @IsEnum(OnDemandContentType)
  type?: OnDemandContentType;

  @ApiPropertyOptional({ description: 'true to show only saved items' })
  @IsOptional()
  @IsBooleanString()
  saved?: string;
}
