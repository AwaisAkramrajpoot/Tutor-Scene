import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '@/database/entities/review.entity';
import { Booking } from '@/database/entities/booking.entity';
import { Prospect } from '@/database/entities/prospect.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewStatus } from '@/database/entities/enums';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Prospect)
    private readonly prospectRepository: Repository<Prospect>,
  ) {}

  async create(createReviewDto: CreateReviewDto): Promise<Review> {
    // Check if booking exists
    const booking = await this.bookingRepository.findOne({
      where: { id: createReviewDto.bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Check if review has already been added for this booking
    if (booking.reviewAdded) {
      throw new BadRequestException('Cannot add more than one review');
    }

    const review = this.reviewRepository.create(createReviewDto);

    const savedReview = await this.reviewRepository.save(review);

    // Update booking to mark review as added
    booking.reviewAdded = true;
    await this.bookingRepository.save(booking);

    return savedReview;
  }

  async findAll(status: string): Promise<any[]> {
    const reviews = await this.reviewRepository.find({
      where: { status: status as ReviewStatus },
      relations: ['student', 'booking'],
      order: { createdAt: 'DESC' },
    });

    // Fetch prospect details for each review
    const reviewsWithProspects = await Promise.all(
      reviews.map(async (review) => {
        const prospect = await this.prospectRepository.findOne({
          where: { id: review.tutorProfileId },
        });

        return {
          ...review,
          tutor: prospect || null,
        };
      }),
    );

    return reviewsWithProspects;
  }

  async findByTutor(tutorProfileId: number, status?: string): Promise<Review[]> {
    const whereCondition: any = { tutorProfileId };
    
    if (status) {
      whereCondition.status = status as ReviewStatus;
    }

    return this.reviewRepository.find({
      where: whereCondition,
      order: { createdAt: 'DESC' },
    });
  }

  async getTutorAverageRating(tutorProfileId: number): Promise<{ averageRating: number; totalReviews: number }> {
    // Only calculate average for approved reviews
    const reviews = await this.reviewRepository.find({
      where: { 
        tutorProfileId,
        status: ReviewStatus.APPROVED 
      },
    });
    
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

  async updateStatus(id: number, status: ReviewStatus): Promise<Review> {
    const review = await this.findOne(id);
    review.status = status;
    return this.reviewRepository.save(review);
  }

  async delete(id: number): Promise<void> {
    const review = await this.findOne(id);
    await this.reviewRepository.remove(review);
  }
}
