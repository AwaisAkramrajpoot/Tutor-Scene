import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '@/database/entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
  ) {}

  async create(createReviewDto: CreateReviewDto, studentProfileId: number): Promise<Review> {
    // Check if review already exists for this booking
    const existingReview = await this.reviewRepository.findOne({
      where: { bookingId: createReviewDto.bookingId },
    });

    if (existingReview) {
      throw new BadRequestException('Review already exists for this booking');
    }

    const review = this.reviewRepository.create({
      ...createReviewDto,
      studentProfileId,
    });

    return this.reviewRepository.save(review);
  }

  async findByTutor(tutorProfileId: number): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { tutorProfileId },
      order: { createdAt: 'DESC' },
    });
  }

  async getTutorAverageRating(tutorProfileId: number): Promise<{ averageRating: number; totalReviews: number }> {
    const reviews = await this.findByTutor(tutorProfileId);
    const totalReviews = reviews.length;
    
    if (totalReviews === 0) {
      return { averageRating: 0, totalReviews: 0 };
    }

    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    const averageRating = sum / totalReviews;

    return { averageRating: Math.round(averageRating * 10) / 10, totalReviews };
  }

  async findOne(id: number): Promise<Review> {
    const review = await this.reviewRepository.findOne({ where: { id } });
    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }
    return review;
  }

  async flagReview(id: number, reason: string): Promise<Review> {
    const review = await this.findOne(id);
    review.isFlagged = true;
    review.flagReason = reason;
    return this.reviewRepository.save(review);
  }

  async delete(id: number): Promise<void> {
    const review = await this.findOne(id);
    await this.reviewRepository.remove(review);
  }
}
