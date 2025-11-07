import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request, Patch, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewStatusDto } from './dto/update-review-status.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { UserRole } from '@/database/entities/enums';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a review' })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  async create(@Body() createReviewDto: CreateReviewDto) {
    return this.reviewsService.create(createReviewDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all reviews (Admin only)' })
  @ApiQuery({ name: 'status', required: false, enum: ['approved', 'rejected', 'pending', 'flagged'], description: 'Filter by review status (defaults to pending)' })
  @ApiResponse({ status: 200, description: 'List of all reviews' })
  async findAll(@Query('status') status?: string) {
    return this.reviewsService.findAll(status || 'pending');
  }

  @Get('tutor/:tutorId')
  @ApiOperation({ summary: 'Get all reviews for a tutor' })
  @ApiQuery({ name: 'status', required: false, enum: ['approved', 'rejected', 'pending'], description: 'Filter by review status' })
  @ApiResponse({ status: 200, description: 'List of reviews' })
  async findByTutor(
    @Param('tutorId') tutorId: string,
    @Query('status') status?: string
  ) {
    return this.reviewsService.findByTutor(+tutorId, status);
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

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update review status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Review status updated' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateReviewStatusDto: UpdateReviewStatusDto
  ) {
    return this.reviewsService.updateStatus(+id, updateReviewStatusDto.status);
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
