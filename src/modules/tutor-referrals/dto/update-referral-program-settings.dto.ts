import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateReferralProgramSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  howItWorksTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  howItWorksSubtitle?: string;

  @IsOptional()
  @IsString()
  howItWorksBody?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  earnTitle?: string;

  @IsOptional()
  @IsString()
  earnBody?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  referralsTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  referralsSubtitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  referralCodeTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  referralLinkTitle?: string;

  @IsOptional()
  @IsString()
  referralShareHint?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  termsUrl?: string;
}
