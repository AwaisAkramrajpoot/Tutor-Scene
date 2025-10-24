import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a review' })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  async create(@Body() createReviewDto: CreateReviewDto, @Request() req: any) {
    return this.reviewsService.create(createReviewDto, req.user.profileId);
  }

  @Get('tutor/:tutorId')
  @ApiOperation({ summary: 'Get all reviews for a tutor' })
  @ApiResponse({ status: 200, description: 'List of reviews' })
  async findByTutor(@Param('tutorId') tutorId: string) {
    return this.reviewsService.findByTutor(+tutorId);
  }

  @Get('tutor/:tutorId/average')
  @ApiOperation({ summary: 'Get average rating for a tutor' })
  @ApiResponse({ status: 200, description: 'Average rating' })
  async getTutorAverageRating(@Param('tutorId') tutorId: string) {
    return this.reviewsService.getTutorAverageRating(+tutorId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get review by ID' })
  @ApiResponse({ status: 200, description: 'Review details' })
  async findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(+id);
  }

  @Patch(':id/flag')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Flag a review as inappropriate' })
  @ApiResponse({ status: 200, description: 'Review flagged' })
  async flagReview(@Param('id') id: string, @Body('reason') reason: string) {
    return this.reviewsService.flagReview(+id, reason);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a review' })
  @ApiResponse({ status: 200, description: 'Review deleted' })
  async delete(@Param('id') id: string) {
    await this.reviewsService.delete(+id);
    return { message: 'Review deleted successfully' };
  }
}
