import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsOptional, IsInt, Min, Max } from 'class-validator';

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

  @ApiPropertyOptional({ example: 5, description: 'Internal use only; not shown on public home' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;
}
