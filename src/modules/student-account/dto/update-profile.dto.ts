import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  gender?: string;

  @ApiPropertyOptional({ description: 'Emoji icon for avatar' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  avatarIcon?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  registersSelfAsLearner?: boolean;
}
