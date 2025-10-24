import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '@/database/entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingStatus } from '@/database/entities/enums';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  async create(createBookingDto: CreateBookingDto, studentProfileId: number): Promise<Booking> {
    const booking = this.bookingRepository.create({
      ...createBookingDto,
      studentProfileId,
      startTime: new Date(createBookingDto.startTime),
      endTime: new Date(createBookingDto.endTime),
      status: BookingStatus.PENDING,
      totalPrice: 0, // Calculate based on tutor rate
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

  async acceptBooking(id: number, tutorProfileId: number): Promise<Booking> {
    const booking = await this.findOne(id);
    if (booking.tutorProfileId !== tutorProfileId) {
      throw new BadRequestException('You can only accept your own bookings');
    }
    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Booking is not in pending status');
    }
    booking.status = BookingStatus.CONFIRMED;
    return this.bookingRepository.save(booking);
  }

  async rejectBooking(id: number, tutorProfileId: number, reason?: string): Promise<Booking> {
    const booking = await this.findOne(id);
    if (booking.tutorProfileId !== tutorProfileId) {
      throw new BadRequestException('You can only reject your own bookings');
    }
    booking.status = BookingStatus.CANCELLED;
    booking.cancellationReason = reason;
    booking.cancelledAt = new Date();
    booking.cancelledBy = tutorProfileId;
    return this.bookingRepository.save(booking);
  }

  async cancelBooking(id: number, userId: number, reason?: string): Promise<Booking> {
    const booking = await this.findOne(id);
    if (![BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(booking.status)) {
      throw new BadRequestException('Cannot cancel this booking');
    }
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
}
