import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan, MoreThan, IsNull, Or } from 'typeorm';
import { Booking } from '@/database/entities/booking.entity';
import { User } from '@/database/entities/user.entity';
import { Prospect } from '@/database/entities/prospect.entity';
import { Payment } from '@/database/entities/payment.entity';
import { Review } from '@/database/entities/review.entity';
import { PlatformSettings } from '@/database/entities/platform-settings.entity';
import { PaymentStatus, ReviewStatus } from '@/database/entities/enums';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingStatus } from '@/database/entities/enums';
import { StripeService } from './services/stripe.service';
import { ZoomService } from '../interviews/services/zoom.service';
import { MailService } from '../auth/services/mail.service';
import { PromoCodesService } from '../promo-codes/promo-codes.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Review } from '@/database/entities/review.entity';
import { PlatformSettings } from '@/database/entities/platform-settings.entity';
import { ReviewStatus } from '@/database/entities/enums';

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
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(PlatformSettings)
    private readonly platformSettingsRepository: Repository<PlatformSettings>,
    private readonly stripeService: StripeService,
    private readonly zoomService: ZoomService,
    private readonly mailService: MailService,
    private readonly promoCodesService: PromoCodesService,
    private readonly notificationsService: NotificationsService,
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

    // Get student details for notification
    const student = await this.userRepository.findOne({
      where: { id: createBookingDto.studentProfileId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Log the tutorProfileId being used
    this.logger.log(`Creating booking with tutorProfileId: ${createBookingDto.tutorProfileId}`);

    // Get tutor prospect to find the user ID
    const tutorProspect = await this.prospectRepository.findOne({
      where: { id: createBookingDto.tutorProfileId },
    });

    if (!tutorProspect) {
      // Log all available prospects for debugging
      const allProspects = await this.prospectRepository.find({ select: ['id', 'fullName'] });
      this.logger.error(`Tutor prospect with ID ${createBookingDto.tutorProfileId} not found`);
      this.logger.error(`Available prospect IDs: ${allProspects.map(p => p.id).join(', ')}`);
      throw new NotFoundException(
        `Tutor prospect with ID ${createBookingDto.tutorProfileId} not found. ` +
        `Available IDs: ${allProspects.map(p => p.id).join(', ')}`
      );
    }

    if (!tutorProspect.userId) {
      throw new BadRequestException('Tutor prospect does not have an associated user account');
    }

    // Generate reference number (TUT001, TUT002, etc.)
    const referenceNumber = await this.generateReferenceNumber();

    // Store discount code if provided (will be validated when tutor accepts)
    const reviewExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

    const booking = this.bookingRepository.create({
      referenceNumber: referenceNumber,
      studentProfileId: createBookingDto.studentProfileId,
      tutorProfileId: createBookingDto.tutorProfileId,
      subjectId: createBookingDto.subjectId,
      startTime,
      endTime,
      status: BookingStatus.TUTOR_REVIEW, // Awaiting tutor approval
      totalPrice: createBookingDto.totalPrice,
      discountCode: createBookingDto.discountCode || null,
      notes: createBookingDto.notes || null,
      learnerLabel: createBookingDto.learnerLabel || null,
      reviewExpiresAt,
    });
    
    const savedBooking = await this.bookingRepository.save(booking);

    // Create notification for tutor
    await this.notificationsService.create({
      userId: tutorProspect.userId,
      notification: `${student.firstName} has sent you a booking request`,
      title: 'New Booking Request',
      preview: 'A learner wants to book a session with you.',
      type: 'booking_request',
      metadata: { bookingId: savedBooking.id },
    });

    if (tutorProspect.autoAcceptBookingRequests) {
      try {
        return await this.acceptBooking(savedBooking.id, tutorProspect.id);
      } catch (error) {
        this.logger.error(
          `Auto-accept failed for booking ${savedBooking.id}: ${error.message}`,
        );
      }
    }

    return savedBooking;
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
      } catch (error: any) {
        this.logger.warn(`Invalid discount code: ${booking.discountCode} - ${error?.message}`);
        // Continue without discount if code is invalid
        booking.discountCode = null;
      }
    }

    const tutorProspectForPayment = await this.prospectRepository.findOne({
      where: { id: prospectId },
      select: ['paymentAccountId', 'paymentOnBoarded'],
    });

    const connectedAccountId = tutorProspectForPayment?.paymentAccountId;
    const skipConnect = this.stripeService.shouldSkipConnect();

    if (!skipConnect) {
      if (!connectedAccountId) {
        throw new BadRequestException(
          'Connect your Stripe account before accepting bookings. Go to My Wallet.',
        );
      }
      const payoutStatus = await this.stripeService.getConnectedAccountPayoutStatus(connectedAccountId);
      if (!payoutStatus.ready) {
        throw new BadRequestException(
          payoutStatus.message || 'Complete your Stripe payout setup before accepting bookings. Go to My Wallet and finish onboarding.',
        );
      }
      if (!tutorProspectForPayment.paymentOnBoarded) {
        await this.prospectRepository.update({ id: prospectId }, { paymentOnBoarded: true });
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

    const platformFeePercentage = 0.15;
    const platformFee = finalPrice * platformFeePercentage;

    const paymentIntent = await this.stripeService.createPaymentIntent(
      finalPrice,
      'usd',
      paymentIntentParams,
      skipConnect ? undefined : connectedAccountId,
      skipConnect ? undefined : platformFee,
    );

    // Apply Stripe coupon if available
    if (stripeCouponId) {
      try {
        // Note: Coupons are typically applied at checkout, not to payment intent
        // We'll store the discount info in the booking for reference
        this.logger.log(`Stripe coupon available: ${stripeCouponId}`);
      } catch (error: any) {
        this.logger.error(`Failed to apply Stripe coupon: ${error?.message}`);
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
    booking.hostStartUrl = zoomMeeting.start_url;
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

    // Get tutor details for notification
    const tutorProspect = await this.prospectRepository.findOne({
      where: { id: prospectId },
    });

    if (tutorProspect) {
      // Create notification for student
      await this.notificationsService.create({
        userId: booking.studentProfileId,
        notification: `Your booking request has been accepted by ${tutorProspect.fullName}`,
        title: 'Booking Confirmation',
        preview: 'Your session has been confirmed.',
        type: 'booking_confirmation',
        metadata: { bookingId: booking.id },
      });
    }

    return booking;
  }

  async confirmBookingPayment(bookingId: number): Promise<Booking> {
    const booking = await this.findOne(bookingId);

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Booking is not awaiting payment');
    }

    booking.status = BookingStatus.CONFIRMED;
    const saved = await this.bookingRepository.save(booking);

    const [tutorProspect, student] = await Promise.all([
      this.prospectRepository.findOne({ where: { id: saved.tutorProfileId } }),
      this.userRepository.findOne({ where: { id: saved.studentProfileId } }),
    ]);

    if (tutorProspect && student) {
      await this.notificationsService.create({
        userId: tutorProspect.userId,
        notification: `${student.firstName} ${student.lastName}'s booking has been confirmed and paid.`,
        title: 'Booking Confirmation',
        preview: 'A learner session is confirmed on your schedule.',
        type: 'booking_confirmation',
        metadata: { bookingId: saved.id },
      });
    }

    return saved;
  }

  async verifyAndConfirmPayment(bookingId: number): Promise<Booking> {
    const booking = await this.findOne(bookingId);

    if (booking.status === BookingStatus.CONFIRMED) {
      return booking;
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException(
        `Booking cannot be confirmed in its current state: ${booking.status}`,
      );
    }

    if (!booking.stripePaymentIntentId) {
      throw new BadRequestException('No payment intent associated with this booking');
    }

    const paymentIntent = await this.stripeService.retrievePaymentIntent(
      booking.stripePaymentIntentId,
    );

    if (paymentIntent.status !== 'succeeded') {
      throw new BadRequestException(
        `Payment not yet completed. Stripe status: ${paymentIntent.status}`,
      );
    }

    return this.confirmBookingPayment(bookingId);
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

    if (booking.tutorProfileId !== prospectId) {
      throw new BadRequestException('You can only reject your own bookings');
    }

    if (booking.status !== BookingStatus.TUTOR_REVIEW) {
      throw new BadRequestException('Booking is not awaiting approval');
    }

    const prospect = await this.prospectRepository.findOne({
      where: { id: prospectId },
    });

    booking.status = BookingStatus.CANCELLED;
    booking.cancellationReason = reason || 'Declined by tutor';
    booking.cancelledAt = new Date();
    booking.cancelledBy = prospect?.userId;
    const saved = await this.bookingRepository.save(booking);

    const tutorName = prospect?.fullName || 'Your tutor';
    await this.notificationsService.create({
      userId: booking.studentProfileId,
      notification: reason?.includes('72 hours')
        ? `Your booking request was automatically declined after 72 hours without a response from ${tutorName}.`
        : `Your booking request was declined by ${tutorName}.`,
      title: 'Cancellation Alert',
      preview: 'A booking request on your schedule was declined.',
      type: 'cancellation',
      metadata: { bookingId: saved.id },
    });

    return saved;
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
    
    // Get tutor prospect to check if userId matches
    const tutorProspect = await this.prospectRepository.findOne({
      where: { id: booking.tutorProfileId },
      select: ['userId'],
    });
    
    const isTutor = tutorProspect && tutorProspect.userId === userId;
    console.log("This is a tutor",isTutor)

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
      } catch (error: any) {
        this.logger.error(`Failed to process refund for booking ${id}: ${error?.message}`);
        throw new BadRequestException('Failed to process refund');
      }
    }

    // Update booking status
    booking.status = BookingStatus.CANCELLED;
    booking.cancellationReason = reason;
    booking.cancelledAt = new Date();
    booking.cancelledBy = userId;

    const saved = await this.bookingRepository.save(booking);

    const notifyUserId = isStudent ? tutorUser.id : booking.studentProfileId;
    await this.notificationsService.create({
      userId: notifyUserId,
      notification: isStudent
        ? `${student.fullName} cancelled a scheduled session.`
        : `${tutor.fullName} cancelled your scheduled session.`,
      title: 'Cancellation Alert',
      preview: 'A session on your schedule was cancelled.',
      type: 'cancellation',
      metadata: { bookingId: saved.id },
    });

    return saved;
  }

  async completeBooking(id: number): Promise<Booking> {
    const booking = await this.findOne(id);
    booking.status = BookingStatus.COMPLETED;
    booking.completedAt = new Date();
    return this.bookingRepository.save(booking);
  }

  async findPendingReviewByTutor(tutorProfileId: number): Promise<Booking[]> {
    const tutorProspect = await this.prospectRepository.findOne({
      where: { id: tutorProfileId },
      select: ['id', 'autoAcceptBookingRequests'],
    });

    if (tutorProspect?.autoAcceptBookingRequests) {
      return [];
    }

    const now = new Date();
    return this.bookingRepository.find({
      where: {
        tutorProfileId,
        status: BookingStatus.TUTOR_REVIEW,
        reviewExpiresAt: Or(IsNull(), MoreThan(now)),
      },
      relations: ['student', 'subject'],
      order: { startTime: 'ASC' },
    });
  }

  async findOneWithDetails(id: number, prospectId?: number): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['student', 'subject', 'tutor'],
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    if (prospectId && booking.tutorProfileId !== prospectId) {
      throw new ForbiddenException('You can only view your own booking requests');
    }

    return booking;
  }

  async getTutorBookingSettings(prospectId: number): Promise<{ autoAcceptBookingRequests: boolean }> {
    const prospect = await this.prospectRepository.findOne({
      where: { id: prospectId },
      select: ['id', 'autoAcceptBookingRequests'],
    });

    if (!prospect) {
      throw new NotFoundException(`Tutor prospect with ID ${prospectId} not found`);
    }

    return { autoAcceptBookingRequests: prospect.autoAcceptBookingRequests ?? false };
  }

  async updateTutorBookingSettings(
    prospectId: number,
    autoAcceptBookingRequests: boolean,
  ): Promise<{ autoAcceptBookingRequests: boolean }> {
    const prospect = await this.prospectRepository.findOne({ where: { id: prospectId } });

    if (!prospect) {
      throw new NotFoundException(`Tutor prospect with ID ${prospectId} not found`);
    }

    prospect.autoAcceptBookingRequests = autoAcceptBookingRequests;
    await this.prospectRepository.save(prospect);

    return { autoAcceptBookingRequests };
  }

  async expireStaleBookingRequests(): Promise<number> {
    const now = new Date();
    const stale = await this.bookingRepository.find({
      where: {
        status: BookingStatus.TUTOR_REVIEW,
        reviewExpiresAt: LessThan(now),
      },
    });

    let count = 0;
    for (const booking of stale) {
      try {
        await this.rejectBooking(
          booking.id,
          booking.tutorProfileId,
          'Expired after 72 hours without response',
        );
        count++;
      } catch (error) {
        this.logger.warn(
          `Failed to expire booking request ${booking.id}: ${error.message}`,
        );
      }
    }

    return count;
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
        .andWhere('booking.status IN (:...statuses)', {
          statuses: [BookingStatus.CONFIRMED, BookingStatus.PENDING],
        })
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
    viewMode: 'count' | 'period' = 'count',
    period?: 'week' | 'month' | '3months',
  ): Promise<{ data: Booking[]; total: number; page: number; limit: number; totalPages: number }> {
    const queryBuilder = this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.student', 'student')
      .leftJoinAndSelect('booking.subject', 'subject')
      .where('booking.tutorProfileId = :tutorId', { tutorId });

    // Apply status-specific filters
    if (status === 'upcoming') {
      const now = new Date();
      queryBuilder
        .andWhere('booking.status IN (:...statuses)', {
          statuses: [BookingStatus.CONFIRMED, BookingStatus.PENDING],
        })
        .andWhere('booking.startTime > :now', { now })
        .orderBy('booking.startTime', 'ASC');

      if (viewMode === 'period' && period) {
        const endDate = new Date(now);
        if (period === 'week') {
          endDate.setDate(endDate.getDate() + 7);
        } else if (period === 'month') {
          endDate.setMonth(endDate.getMonth() + 1);
        } else if (period === '3months') {
          endDate.setMonth(endDate.getMonth() + 3);
        }
        queryBuilder.andWhere('booking.startTime <= :endDate', { endDate });
      }
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

  // private async generateBookingId(): Promise<string> {
  //   // Get the latest booking to determine the next number
  //   const latestBooking = await this.bookingRepository
  //     .createQueryBuilder('booking')
  //     .orderBy('booking.createdAt', 'DESC')
  //     .limit(1)
  //     .getOne();

  //   let nextNumber = 1;
    
  //   if (latestBooking && latestBooking.bookingId) {
  //     // Extract number from ID like "tut001" -> 1
  //     const match = latestBooking.bookingId.match(/\d+$/);
  //     if (match) {
  //       nextNumber = parseInt(match[0], 10) + 1;
  //     }
  //   }

  //   // Format as tut001, tut002, etc.
  //   return `tut${nextNumber.toString().padStart(3, '0')}`;
  // }

  private getCurrentWeekRange(): { startOfWeek: Date; endOfWeek: Date } {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return { startOfWeek, endOfWeek };
  }

  async getTutorStatistics(tutorId: number): Promise<{
    weeklyEarnings: number;
    currentWeekBookingsCount: number;
    weeklyLearnersCount: number;
  }> {
    const { startOfWeek, endOfWeek } = this.getCurrentWeekRange();

    const currentWeekBookingsCount = await this.bookingRepository
      .createQueryBuilder('booking')
      .where('booking.tutorProfileId = :tutorId', { tutorId })
      .andWhere('booking.startTime >= :startOfWeek', { startOfWeek })
      .andWhere('booking.startTime <= :endOfWeek', { endOfWeek })
      .andWhere('booking.status IN (:...statuses)', {
        statuses: ['confirmed', 'completed'],
      })
      .getCount();

    const weeklyLearnersResult = await this.bookingRepository
      .createQueryBuilder('booking')
      .select('COUNT(DISTINCT booking.studentProfileId)', 'count')
      .where('booking.tutorProfileId = :tutorId', { tutorId })
      .andWhere('booking.startTime >= :startOfWeek', { startOfWeek })
      .andWhere('booking.startTime <= :endOfWeek', { endOfWeek })
      .andWhere('booking.status IN (:...statuses)', {
        statuses: ['confirmed', 'completed'],
      })
      .getRawOne();

    const weeklyEarningsResult = await this.bookingRepository
      .createQueryBuilder('booking')
      .select(
        'COALESCE(SUM(COALESCE(booking.totalPrice, 0) - COALESCE(booking.platformFee, booking.totalPrice * 0.15)), 0)',
        'total',
      )
      .where('booking.tutorProfileId = :tutorId', { tutorId })
      .andWhere('booking.status = :status', { status: 'completed' })
      .andWhere('booking.startTime >= :startOfWeek', { startOfWeek })
      .andWhere('booking.startTime <= :endOfWeek', { endOfWeek })
      .getRawOne();

    return {
      weeklyEarnings: Number(weeklyEarningsResult?.total || 0),
      currentWeekBookingsCount,
      weeklyLearnersCount: Number(weeklyLearnersResult?.count || 0),
    };
  }

  async getTutorRatings(tutorId: number): Promise<{
    satisfactionRate: number;
    acceptanceRate: number;
    cancellationRate: number;
    ratingPeriodMonths: number;
    totalReviews: number;
  }> {
    const settings = await this.platformSettingsRepository.findOne({ where: { id: 1 } });
    const ratingPeriodMonths = settings?.ratingPeriodMonths ?? 3;

    const since = new Date();
    since.setMonth(since.getMonth() - ratingPeriodMonths);

    // Satisfaction rate — average approved review rating in period
    const reviews = await this.reviewRepository.find({
      where: { tutorProfileId: tutorId, status: ReviewStatus.APPROVED },
    });
    const recentReviews = reviews.filter((r) => new Date(r.createdAt) >= since);
    const totalReviews = recentReviews.length;
    const satisfactionRate =
      totalReviews > 0
        ? Math.round(
            (recentReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10,
          ) / 10
        : 0;

    // Acceptance & cancellation rates — bookings created in period (exclude tutor_review still waiting)
    const bookings = await this.bookingRepository
      .createQueryBuilder('b')
      .select('b.status', 'status')
      .where('b.tutorProfileId = :tutorId', { tutorId })
      .andWhere('b.createdAt >= :since', { since })
      .andWhere('b.status IN (:...statuses)', {
        statuses: [
          BookingStatus.PENDING,
          BookingStatus.CONFIRMED,
          BookingStatus.COMPLETED,
          BookingStatus.CANCELLED,
        ],
      })
      .getRawMany();

    const total = bookings.length;
    const accepted = bookings.filter((b) =>
      [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.COMPLETED].includes(
        b.status,
      ),
    ).length;
    const cancelled = bookings.filter((b) => b.status === BookingStatus.CANCELLED).length;

    const acceptanceRate = total > 0 ? Math.round((accepted / total) * 100) : 0;
    const cancellationRate = total > 0 ? Math.round((cancelled / total) * 100) : 0;

    return { satisfactionRate, acceptanceRate, cancellationRate, ratingPeriodMonths, totalReviews };
  }

  private mapEarningStatus(
    booking: Booking,
    payment: Payment | undefined,
  ): 'pending' | 'cleared' | 'paid_out' | 'refunded' {
    if (
      booking.hasRefunded ||
      payment?.status === PaymentStatus.REFUNDED ||
      payment?.status === PaymentStatus.PARTIALLY_REFUNDED
    ) {
      return 'refunded';
    }
    if (
      !payment ||
      payment.status === PaymentStatus.PENDING ||
      payment.status === PaymentStatus.PROCESSING
    ) {
      return 'pending';
    }
    if (payment.status === PaymentStatus.SUCCEEDED) {
      if (booking.status === BookingStatus.COMPLETED) {
        return payment.paidAt ? 'paid_out' : 'cleared';
      }
      return 'cleared';
    }
    return 'pending';
  }

  async getTutorEarningsHistory(
    userId: number,
    statusFilter = 'all',
    sort: 'newest' | 'oldest' = 'newest',
    paymentStatusFilter = 'all',
  ) {
    const prospect = await this.prospectRepository.findOne({
      where: { userId },
      order: { id: 'DESC' },
    });
    if (!prospect) {
      throw new NotFoundException('Tutor profile not found');
    }

    const qb = this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.student', 'student')
      .leftJoinAndSelect('booking.subject', 'subject')
      .where('booking.tutorProfileId = :prospectId', { prospectId: prospect.id })
      .andWhere('booking.status IN (:...statuses)', {
        statuses: [
          BookingStatus.CONFIRMED,
          BookingStatus.COMPLETED,
          BookingStatus.CANCELLED,
          BookingStatus.PENDING,
        ],
      });

    if (statusFilter === 'completed') {
      qb.andWhere('booking.status = :st', { st: BookingStatus.COMPLETED });
    } else if (statusFilter === 'upcoming') {
      qb.andWhere('booking.status = :st', { st: BookingStatus.CONFIRMED }).andWhere(
        'booking.startTime > :now',
        { now: new Date() },
      );
    } else if (statusFilter === 'cancelled') {
      qb.andWhere('booking.status = :st', { st: BookingStatus.CANCELLED });
    }

    qb.orderBy('booking.startTime', sort === 'oldest' ? 'ASC' : 'DESC').take(200);

    const bookings = await qb.getMany();
    const bookingIds = bookings.map((b) => b.id);
    const payments =
      bookingIds.length > 0
        ? await this.paymentRepository.find({
            where: { bookingId: In(bookingIds) },
          })
        : [];
    const paymentByBooking = new Map(payments.map((p) => [p.bookingId, p]));

    let availableBalance = 0;
    let pendingBalance = 0;

    const transactions = bookings.map((booking) => {
      const payment = paymentByBooking.get(booking.id);
      const gross = Number(booking.finalPrice ?? booking.totalPrice ?? 0);
      const platformFee = Number(
        payment?.platformFee ?? booking.platformFee ?? gross * 0.15,
      );
      const sessionBasePay = Number(
        payment?.tutorPayout ?? Math.max(gross - platformFee, 0),
      );
      const sessionTips = 0;
      const sessionTotal = sessionBasePay + sessionTips;
      const earningStatus = this.mapEarningStatus(booking, payment);

      if (earningStatus === 'cleared' || earningStatus === 'paid_out') {
        availableBalance += sessionTotal;
      } else if (earningStatus === 'pending') {
        pendingBalance += sessionTotal;
      }

      return {
        id: booking.id,
        dateTime: booking.startTime,
        sessionId: booking.referenceNumber || `TUT${String(booking.id).padStart(3, '0')}`,
        learnerId: booking.learnerLabel || `LRN-${booking.studentProfileId}`,
        sessionBasePay,
        sessionTips,
        sessionTotal,
        status: earningStatus,
        subject: booking.subject?.name || null,
      };
    });

    const filtered =
      paymentStatusFilter === 'all'
        ? transactions
        : transactions.filter((t) => t.status === paymentStatusFilter);

    return {
      availableBalance,
      pendingBalance,
      transactions: filtered,
    };
  }

  private async generateReferenceNumber(): Promise<string> {
    // Get the latest booking to determine the next number
    const latestBooking = await this.bookingRepository
      .createQueryBuilder('booking')
      .orderBy('booking.createdAt', 'DESC')
      .limit(1)
      .getOne();

    let nextNumber = 1;
    
    if (latestBooking && latestBooking.referenceNumber) {
      // Extract number from reference like "TUT001" -> 1
      const match = latestBooking.referenceNumber.match(/\d+$/);
      if (match) {
        nextNumber = parseInt(match[0], 10) + 1;
      }
    }

    // Format as TUT001, TUT002, etc. (uppercase)
    return `TUT${nextNumber.toString().padStart(3, '0')}`;
  }

  async verifyAndConfirmPayment(bookingId: number): Promise<Booking> {
    const booking = await this.findOne(bookingId);
    if (booking.status === BookingStatus.CONFIRMED) return booking;
    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException(`Booking is in status "${booking.status}" and cannot be confirmed`);
    }
    if (!booking.stripePaymentIntentId) {
      throw new BadRequestException('No payment intent found for this booking');
    }
    const paymentIntent = await this.stripeService.retrievePaymentIntent(booking.stripePaymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
      throw new BadRequestException(`Payment not completed. Stripe status: ${paymentIntent.status}`);
    }
    return this.confirmBookingPayment(bookingId);
  }

  async getTutorRatings(tutorId: number): Promise<{
    satisfactionRate: number;
    acceptanceRate: number;
    cancellationRate: number;
    ratingPeriodMonths: number;
    totalReviews: number;
  }> {
    const settings = await this.platformSettingsRepository.findOne({ where: { id: 1 } });
    const ratingPeriodMonths = settings?.ratingPeriodMonths ?? 3;

    const since = new Date();
    since.setMonth(since.getMonth() - ratingPeriodMonths);

    const reviews = await this.reviewRepository.find({
      where: { tutorProfileId: tutorId, status: ReviewStatus.APPROVED },
    });
    const recentReviews = reviews.filter((r) => new Date(r.createdAt) >= since);
    const totalReviews = recentReviews.length;
    const satisfactionRate =
      totalReviews > 0
        ? Math.round((recentReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10
        : 0;

    const bookings = await this.bookingRepository
      .createQueryBuilder('b')
      .select('b.status', 'status')
      .where('b.tutorProfileId = :tutorId', { tutorId })
      .andWhere('b.createdAt >= :since', { since })
      .andWhere('b.status IN (:...statuses)', {
        statuses: [
          BookingStatus.PENDING,
          BookingStatus.CONFIRMED,
          BookingStatus.COMPLETED,
          BookingStatus.CANCELLED,
        ],
      })
      .getRawMany();

    const total = bookings.length;
    const accepted = bookings.filter((b) =>
      [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.COMPLETED].includes(b.status),
    ).length;
    const cancelled = bookings.filter((b) => b.status === BookingStatus.CANCELLED).length;

    const acceptanceRate = total > 0 ? Math.round((accepted / total) * 100) : 0;
    const cancellationRate = total > 0 ? Math.round((cancelled / total) * 100) : 0;

    return { satisfactionRate, acceptanceRate, cancellationRate, ratingPeriodMonths, totalReviews };
  }
}
