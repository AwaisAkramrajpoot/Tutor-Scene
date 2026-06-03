import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class AddToCartDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  contentId: number;
}
