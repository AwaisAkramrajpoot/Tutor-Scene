import { IsIn, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class SaveLearnerAssessmentDto {
  @IsString()
  @MaxLength(120)
  learnerLabel: string;

  @IsObject()
  answers: Record<string, string>;

  @IsIn(['draft', 'completed'])
  status: 'draft' | 'completed';

  @IsOptional()
  @IsString()
  @MaxLength(100)
  learnerFirstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  gradeLevel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  gender?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  relationshipToLearner?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  learnerLastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  avatarIcon?: string;
}
