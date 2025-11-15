import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateTestimonialDto {
  @ApiProperty({ example: 'This platform has been amazing for my learning journey!' })
  @IsString()
  @IsNotEmpty()
  testimonial: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  testimonialBy: string;
}
