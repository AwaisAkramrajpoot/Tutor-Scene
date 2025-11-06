import { IsString, IsInt, IsOptional, IsDate, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class OnboardingDto {
  @ApiProperty({
    description: 'User ID from the authenticated user',
    example: 1
  })
  @IsInt()
  userId: number;

  @ApiProperty({
    description: 'Full name of the tutor',
    example: 'John Smith'
  })
  @IsString()
  fullName: string;

  @ApiProperty({
    description: 'Date of birth',
    example: '1990-01-01',
    type: Date
  })
  @IsDate()
  @Type(() => Date)
  dateOfBirth: Date;

  @ApiProperty({
    description: 'Subjects the tutor can teach',
    example: 'Mathematics, Physics'
  })
  @IsString()
  subjects: string;

  @ApiProperty({
    description: 'Grade levels the tutor can teach',
    example: 'High School, College'
  })
  @IsString()
  gradeLevels: string;

  @ApiProperty({
    description: 'Years of teaching experience',
    example: 5,
    minimum: 0
  })
  @IsInt()
  @Min(0)
  yearsOfExperience: number;

  @ApiProperty({
    description: 'Teaching philosophy of the tutor',
    example: 'I believe in hands-on learning and practical applications of theoretical concepts.'
  })
  @IsString()
  teachingPhilosophy: string;

  @ApiProperty({
    description: 'URL to the tutor\'s CV',
    example: 'https://my-bucket.s3.amazonaws.com/cv-12345.pdf',
    required: false
  })
  @IsOptional()
  @IsString()
  cv?: string;

  @ApiProperty({
    description: 'URL to the tutor\'s introduction video',
    example: 'https://my-bucket.s3.amazonaws.com/video-67890.mp4',
    required: false
  })
  @IsOptional()
  @IsString()
  introVideo?: string;

  @ApiProperty({
    description: 'Preferred interview time',
    example: '2023-12-01T10:00:00Z',
    type: Date,
    required: false
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  interviewTime?: Date;

  @ApiProperty({
    description: 'URL to the tutor\'s government ID',
    example: 'https://my-bucket.s3.amazonaws.com/id-54321.jpg',
    required: false
  })
  @IsOptional()
  @IsString()
  govId?: string;

  @ApiProperty({
    description: 'URL to the tutor\'s profile picture',
    example: 'https://my-bucket.s3.amazonaws.com/profile-12345.jpg',
    required: false
  })
  @IsOptional()
  @IsString()
  profilePic?: string;
}
