import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '@/database/entities/booking.entity';
import { User } from '@/database/entities/user.entity';
import { Prospect } from '@/database/entities/prospect.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingStatus } from '@/database/entities/enums';
import { StripeService } from './services/stripe.service';
import { ZoomService } from '../interviews/services/zoom.service';
import { MailService } from '../auth/services/mail.service';
import { PromoCodesService } from '../promo-codes/promo-codes.service';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Prospect)
    private readonly prospectRepository: Repository<Prospect>,
    private readonly stripeService: StripeService,
    private readonly zoomService: ZoomService,
    private readonly mailService: MailService,
    private readonly promoCodesService: PromoCodesService,
  ) { }

  async create(createBookingDto: CreateBookingDto): Promise<Booking> {
    // Parse dates as UTC
    const startTime = new Date(createBookingDto.startTime);
    const endTime = new Date(createBookingDto.endTime);

    // Validate that end time is after start time
    if (endTime <= startTime) {
      throw new BadRequestException('End time must be after start time');
    }

    // Validate totalPrice
    if (createBookingDto.totalPrice < 0) {
      throw new BadRequestException('Total price must be a positive number');
    }

    // Store discount code if provided (will be validated when tutor accepts)
    const booking = this.bookingRepository.create({
      studentProfileId: createBookingDto.studentProfileId,
      tutorProfileId: createBookingDto.tutorProfileId,
      subjectId: createBookingDto.subjectId,
      startTime,
      endTime,
      status: BookingStatus.TUTOR_REVIEW, // Awaiting tutor approval
      totalPrice: createBookingDto.totalPrice,
      discountCode: createBookingDto.discountCode || null,
    });
    return this.bookingRepository.save(booking);
  }

  async findAll(userId?: number): Promise<Booking[]> {
    if (userId) {
      return this.bookingRepository.find({
        where: [{ studentProfileId: userId }, { tutorProfileId: userId }],
        order: { startTime: 'DESC' },
      });
    }
    return this.bookingRepository.find({ order: { startTime: 'DESC' } });
  }

  async findOne(id: number): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({ where: { id } });
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }
    return booking;
  }

  async acceptBooking(id: number, prospectId: number): Promise<Booking> {
    const booking = await this.findOne(id);

    // Simple check: does the booking belong to this prospect?
    if (booking.tutorProfileId !== prospectId) {
      throw new BadRequestException('You can only accept your own bookings');
    }

    if (booking.status !== BookingStatus.TUTOR_REVIEW) {
      throw new BadRequestException('Booking is not awaiting approval');
    }

    // Get student details for email
    const student = await this.userRepository.findOne({
      where: { id: booking.studentProfileId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // IMPORTANT: Always use the ORIGINAL totalPrice from the booking
    // This ensures discount is calculated on the correct base amount
    const originalPrice = Number(booking.totalPrice);
    this.logger.log(`Accept booking - Original price from DB: ${originalPrice}`);
    
    let finalPrice = originalPrice;
    let discountAmount = 0;
    let stripeCouponId: string | undefined;

    // Validate and apply discount code if provided
    if (booking.discountCode) {
      try {
        this.logger.log(`Validating discount code: ${booking.discountCode} for original price: ${originalPrice}`);
        
        // ALWAYS validate against the ORIGINAL price, not any modified price
        const validation = await this.promoCodesService.validate(
          booking.discountCode,
          originalPrice,
        );
        
        if (validation.valid) {
          discountAmount = validation.discount;
          finalPrice = originalPrice - discountAmount;
          
          this.logger.log(`Discount calculation: ${originalPrice} - ${discountAmount} = ${finalPrice}`);
          
          // Get the Stripe coupon ID
          const promoCode = await this.promoCodesService.findByCode(booking.discountCode);
          stripeCouponId = promoCode.stripeCouponId;
          
          // Increment usage count
          await this.promoCodesService.incrementUsage(booking.discountCode);
          
          this.logger.log(`Discount applied: ${booking.discountCode}, Amount: ${discountAmount}, Final Price: ${finalPrice}`);
        }
      } catch (error) {
        this.logger.warn(`Invalid discount code: ${booking.discountCode} - ${error.message}`);
        // Continue without discount if code is invalid
        booking.discountCode = null;
      }
    }

    // Create Stripe payment intent with discount
    const paymentIntentParams: any = {
      bookingId: booking.id.toString(),
      studentId: booking.studentProfileId.toString(),
      tutorId: booking.tutorProfileId.toString(),
    };

    if (booking.discountCode) {
      paymentIntentParams.discountCode = booking.discountCode;
    }

    const paymentIntent = await this.stripeService.createPaymentIntent(
      finalPrice,
      'usd',
      paymentIntentParams,
    );

    // Apply Stripe coupon if available
    if (stripeCouponId) {
      try {
        // Note: Coupons are typically applied at checkout, not to payment intent
        // We'll store the discount info in the booking for reference
        this.logger.log(`Stripe coupon available: ${stripeCouponId}`);
      } catch (error) {
        this.logger.error(`Failed to apply Stripe coupon: ${error.message}`);
      }
    }

    // Create Zoom meeting for the class
    const duration = Math.ceil(
      (booking.endTime.getTime() - booking.startTime.getTime()) / (1000 * 60),
    );
    const zoomMeeting = await this.zoomService.createMeeting(
      `Tutoring Session - ${student.fullName}`,
      booking.startTime,
      duration,
    );

    // Update booking with payment intent, Zoom details, and discount info
    booking.stripePaymentIntentId = paymentIntent.id;
    booking.zoomMeetingId = zoomMeeting.id;
    booking.zoomJoinLink = zoomMeeting.join_url;
    booking.discountAmount = discountAmount;
    booking.finalPrice = finalPrice;
    booking.status = BookingStatus.PENDING; // Awaiting payment
    await this.bookingRepository.save(booking);

    // Send payment email to student with final price
    await this.mailService.sendBookingPaymentEmail(
      student.email,
      student.fullName,
      booking.id,
      finalPrice,
      booking.startTime,
      paymentIntent.id,
    );

    return booking;
  }

  async confirmBookingPayment(bookingId: number): Promise<Booking> {
    const booking = await this.findOne(bookingId);

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Booking is not awaiting payment');
    }

    booking.status = BookingStatus.CONFIRMED;
    return this.bookingRepository.save(booking);
  }

  async findByPaymentIntentId(paymentIntentId: string): Promise<Booking | null> {
    return this.bookingRepository.findOne({
      where: { stripePaymentIntentId: paymentIntentId },
    });
  }

  async getPaymentIntentClientSecret(
    bookingId: number,
    userId: number,
  ): Promise<{ clientSecret: string }> {
    const booking = await this.findOne(bookingId);

    // Verify user is the student for this booking
    if (booking.studentProfileId !== userId) {
      throw new BadRequestException('You can only access your own booking payments');
    }

    if (!booking.stripePaymentIntentId) {
      throw new NotFoundException('No payment intent found for this booking');
    }

    const paymentIntent = await this.stripeService.retrievePaymentIntent(
      booking.stripePaymentIntentId,
    );

    return { clientSecret: paymentIntent.client_secret };
  }

  async rejectBooking(id: number, prospectId: number, reason?: string): Promise<Booking> {
    const booking = await this.findOne(id);

    // Simple check: does the booking belong to this prospect?
    if (booking.tutorProfileId !== prospectId) {
      throw new BadRequestException('You can only reject your own bookings');
    }

    booking.status = BookingStatus.CANCELLED;
    booking.cancellationReason = reason;
    booking.cancelledAt = new Date();
    booking.cancelledBy = prospectId;
    return this.bookingRepository.save(booking);
  }

  async cancelBooking(id: number, userId: number, reason?: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['student', 'tutor'],
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    // Only allow cancellation of confirmed bookings
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('Only confirmed bookings can be cancelled');
    }

    // Check if user is either the student or tutor
    const isStudent = booking.studentProfileId === userId;
    const isTutor = booking.tutorProfileId === userId;

    if (!isStudent && !isTutor) {
      throw new BadRequestException('You can only cancel your own bookings');
    }

    // Get student and tutor details
    const student = booking.student;
    const tutor = booking.tutor;

    if (!student || !tutor) {
      throw new NotFoundException('Student or tutor information not found');
    }

    // Get tutor's user account for email
    const tutorUser = await this.userRepository.findOne({
      where: { id: tutor.userId },
    });

    if (!tutorUser) {
      throw new NotFoundException('Tutor user account not found');
    }

    // Send appropriate email based on who is cancelling
    if (isTutor) {
      // Tutor is cancelling - send email to student
      await this.mailService.sendBookingCancellationToStudent(
        student.email,
        student.fullName,
        tutor.fullName,
        booking.startTime,
      );
    } else {
      // Student is cancelling - send email to tutor
      await this.mailService.sendBookingCancellationToTutor(
        tutorUser.email,
        tutor.fullName,
        student.fullName,
        booking.startTime,
      );
    }

    // Process refund if payment was made
    if (booking.stripePaymentIntentId && !booking.hasRefunded) {
      try {
        await this.stripeService.refundPayment(booking.stripePaymentIntentId);
        // Note: hasRefunded will be set to true via webhook when refund succeeds
      } catch (error) {
        this.logger.error(`Failed to process refund for booking ${id}: ${error.message}`);
        throw new BadRequestException('Failed to process refund');
      }
    }

    // Update booking status
    booking.status = BookingStatus.CANCELLED;
    booking.cancellationReason = reason;
    booking.cancelledAt = new Date();
    booking.cancelledBy = userId;

    return this.bookingRepository.save(booking);
  }

  async completeBooking(id: number): Promise<Booking> {
    const booking = await this.findOne(id);
    booking.status = BookingStatus.COMPLETED;
    booking.completedAt = new Date();
    return this.bookingRepository.save(booking);
  }

  async findPendingReviewByTutor(tutorProfileId: number): Promise<Booking[]> {
    return this.bookingRepository.find({
      where: {
        tutorProfileId,
        status: BookingStatus.TUTOR_REVIEW,
      },
      relations: ['student', 'subject'],
      order: { startTime: 'ASC' },
    });
  }

  async findStudentSessions(
    studentId: number,
    status: 'upcoming' | 'cancelled' | 'completed',
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: Booking[]; total: number; page: number; limit: number; totalPages: number }> {
    const queryBuilder = this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.tutor', 'tutor')
      .leftJoinAndSelect('booking.subject', 'subject')
      .where('booking.studentProfileId = :studentId', { studentId });

    // Apply status-specific filters
    if (status === 'upcoming') {
      queryBuilder
        .andWhere('booking.status = :status', { status: BookingStatus.CONFIRMED })
        .andWhere('booking.startTime > :now', { now: new Date() })
        .orderBy('booking.startTime', 'ASC');
    } else if (status === 'cancelled') {
      queryBuilder
        .andWhere('booking.status = :status', { status: BookingStatus.CANCELLED })
        .orderBy('booking.cancelledAt', 'DESC');
    } else if (status === 'completed') {
      queryBuilder
        .andWhere('booking.status = :status', { status: BookingStatus.COMPLETED })
        .orderBy('booking.completedAt', 'DESC');
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Get data
    const data = await queryBuilder.getMany();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findTutorSessions(
    tutorId: number,
    status: 'upcoming' | 'cancelled' | 'completed',
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: Booking[]; total: number; page: number; limit: number; totalPages: number }> {
    const queryBuilder = this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.student', 'student')
      .leftJoinAndSelect('booking.subject', 'subject')
      .where('booking.tutorProfileId = :tutorId', { tutorId });

    // Apply status-specific filters
    if (status === 'upcoming') {
      queryBuilder
        .andWhere('booking.status = :status', { status: BookingStatus.CONFIRMED })
        .andWhere('booking.startTime > :now', { now: new Date() })
        .orderBy('booking.startTime', 'ASC');
    } else if (status === 'cancelled') {
      queryBuilder
        .andWhere('booking.status = :status', { status: BookingStatus.CANCELLED })
        .orderBy('booking.cancelledAt', 'DESC');
    } else if (status === 'completed') {
      queryBuilder
        .andWhere('booking.status = :status', { status: BookingStatus.COMPLETED })
        .orderBy('booking.completedAt', 'DESC');
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Get data
    const data = await queryBuilder.getMany();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async markBookingAsRefunded(paymentIntentId: string): Promise<void> {
    const booking = await this.bookingRepository.findOne({
      where: { stripePaymentIntentId: paymentIntentId },
    });

    if (!booking) {
      this.logger.warn(`No booking found for payment intent: ${paymentIntentId}`);
      return;
    }

    booking.hasRefunded = true;
    await this.bookingRepository.save(booking);
    this.logger.log(`Booking ${booking.id} marked as refunded`);
  }

  async getTutorStatistics(tutorId: number): Promise<{
    currentWeekBookingsCount: number;
    activeStudentsCount: number;
  }> {
    // Get start and end of current week (Sunday to Saturday)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Count bookings for current week (past or future)
    const currentWeekBookingsCount = await this.bookingRepository
      .createQueryBuilder('booking')
      .where('booking.tutorProfileId = :tutorId', { tutorId })
      .andWhere('booking.startTime >= :startOfWeek', { startOfWeek })
      .andWhere('booking.startTime <= :endOfWeek', { endOfWeek })
      .getCount();

    // Count active students
    const activeStudentsCount = await this.userRepository
      .createQueryBuilder('user')
      .where('user.role = :role', { role: 'student' })
      .andWhere('user.status = :status', { status: 'active' })
      .getCount();

    return {
      currentWeekBookingsCount,
      activeStudentsCount,
    };
  }
}
