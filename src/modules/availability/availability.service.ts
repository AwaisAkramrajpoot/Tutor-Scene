import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { AvailabilitySlot } from '@/database/entities/availability-slot.entity';
import { Booking } from '@/database/entities/booking.entity';
import { Prospect } from '@/database/entities/prospect.entity';
import { BookingStatus } from '@/database/entities/enums';
import { CreateAvailabilitySlotDto } from './dto/create-availability-slot.dto';

export type LearnerCalendarSlotStatus =
  | 'available'
  | 'pending'
  | 'booked'
  | 'unavailable';

export type LearnerCalendarSlot = {
  id: string;
  availabilityId: number;
  startTime: string;
  endTime: string;
  status: LearnerCalendarSlotStatus;
  bookingId?: number;
  isOwnBooking?: boolean;
};

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(AvailabilitySlot)
    private readonly availabilityRepository: Repository<AvailabilitySlot>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Prospect)
    private readonly prospectRepository: Repository<Prospect>,
  ) {}

  async create(createDto: CreateAvailabilitySlotDto, tutorProfileId: number): Promise<AvailabilitySlot> {
    // Validate that end time is after start time
    const startTime = new Date(createDto.startTime);
    const endTime = new Date(createDto.endTime);

    if (endTime <= startTime) {
      throw new BadRequestException('End time must be after start time');
    }

    const slot = this.availabilityRepository.create({
      tutorProfileId,
      startTime,
      endTime,
    });
    
    return this.availabilityRepository.save(slot);
  }

  async createBulk(createDtos: CreateAvailabilitySlotDto[]): Promise<AvailabilitySlot[]> {
    const slots = createDtos.map(dto => {
      const startTime = new Date(dto.startTime);
      const endTime = new Date(dto.endTime);

      if (endTime <= startTime) {
        throw new BadRequestException('End time must be after start time');
      }

      return this.availabilityRepository.create({
        tutorProfileId: dto.tutorProfileId,
        startTime,
        endTime,
      });
    });

    return this.availabilityRepository.save(slots);
  }

  async findByTutor(tutorProfileId: number, includeExpired = false): Promise<AvailabilitySlot[]> {
    const query: any = { tutorProfileId };
    
    // Only show future slots by default
    if (!includeExpired) {
      query.startTime = MoreThanOrEqual(new Date());
    }

    return this.availabilityRepository.find({
      where: query,
      order: { startTime: 'ASC' },
    });
  }

  async findOne(id: number): Promise<AvailabilitySlot> {
    const slot = await this.availabilityRepository.findOne({ where: { id } });
    if (!slot) {
      throw new NotFoundException(`Availability slot with ID ${id} not found`);
    }
    return slot;
  }

  async update(id: number, updateDto: Partial<CreateAvailabilitySlotDto>): Promise<AvailabilitySlot> {
    const slot = await this.findOne(id);
    
    // Validate times if provided
    if (updateDto.startTime || updateDto.endTime) {
      const startTime = updateDto.startTime ? new Date(updateDto.startTime) : slot.startTime;
      const endTime = updateDto.endTime ? new Date(updateDto.endTime) : slot.endTime;

      if (endTime <= startTime) {
        throw new BadRequestException('End time must be after start time');
      }

      if (updateDto.startTime) slot.startTime = startTime;
      if (updateDto.endTime) slot.endTime = endTime;
    }

    if (updateDto.tutorProfileId) {
      slot.tutorProfileId = updateDto.tutorProfileId;
    }

    return this.availabilityRepository.save(slot);
  }

  async delete(id: number): Promise<void> {
    const slot = await this.findOne(id);
    await this.availabilityRepository.remove(slot);
  }

  async deleteBulk(ids: number[]): Promise<void> {
    await this.availabilityRepository.delete(ids);
  }

  private timesOverlap(
    aStart: Date,
    aEnd: Date,
    bStart: Date,
    bEnd: Date,
  ): boolean {
    return aStart < bEnd && aEnd > bStart;
  }

  private splitIntoHourSegments(
    start: Date,
    end: Date,
  ): Array<{ start: Date; end: Date }> {
    const segments: Array<{ start: Date; end: Date }> = [];
    let cursor = new Date(start);
    const endMs = end.getTime();
    while (cursor.getTime() < endMs) {
      const segEnd = new Date(
        Math.min(cursor.getTime() + 60 * 60 * 1000, endMs),
      );
      segments.push({ start: new Date(cursor), end: segEnd });
      cursor = segEnd;
    }
    return segments;
  }

  private resolveSegmentStatus(
    segStart: Date,
    segEnd: Date,
    bookings: Booking[],
    studentId?: number,
  ): Pick<LearnerCalendarSlot, 'status' | 'bookingId' | 'isOwnBooking'> {
    const overlapping = bookings.filter((b) =>
      this.timesOverlap(segStart, segEnd, new Date(b.startTime), new Date(b.endTime)),
    );

    if (!overlapping.length) {
      return { status: 'available' };
    }

    const ownConfirmed = overlapping.find(
      (b) =>
        b.status === BookingStatus.CONFIRMED &&
        studentId != null &&
        b.studentProfileId === studentId,
    );
    if (ownConfirmed) {
      return {
        status: 'booked',
        bookingId: ownConfirmed.id,
        isOwnBooking: true,
      };
    }

    const otherConfirmed = overlapping.find(
      (b) => b.status === BookingStatus.CONFIRMED,
    );
    if (otherConfirmed) {
      return {
        status: 'unavailable',
        bookingId: otherConfirmed.id,
        isOwnBooking: false,
      };
    }

    const pending = overlapping.find((b) =>
      [BookingStatus.TUTOR_REVIEW, BookingStatus.PENDING].includes(b.status),
    );
    if (pending) {
      return {
        status: 'pending',
        bookingId: pending.id,
        isOwnBooking:
          studentId != null && pending.studentProfileId === studentId,
      };
    }

    return { status: 'unavailable' };
  }

  /**
   * Learner booking calendar: availability segments with booking overlap status.
   */
  async getLearnerCalendarSlots(
    tutorUserId: number,
    options: {
      tutorProspectId?: number;
      studentId?: number;
      start?: string;
      end?: string;
    } = {},
  ): Promise<{
    slots: LearnerCalendarSlot[];
    daysWithAvailability: string[];
  }> {
    const rangeStart = options.start
      ? new Date(options.start)
      : new Date();
    const rangeEnd = options.end
      ? new Date(options.end)
      : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    if (Number.isNaN(rangeStart.getTime()) || Number.isNaN(rangeEnd.getTime())) {
      throw new BadRequestException('Invalid start or end date');
    }

    let tutorProspectId = options.tutorProspectId;
    if (!tutorProspectId) {
      const prospect = await this.prospectRepository.findOne({
        where: { userId: tutorUserId },
        order: { updatedAt: 'DESC' },
      });
      tutorProspectId = prospect?.id;
    }

    const availability = await this.availabilityRepository
      .createQueryBuilder('slot')
      .where('slot.tutorProfileId = :tutorUserId', { tutorUserId })
      .andWhere('slot.startTime < :rangeEnd', { rangeEnd })
      .andWhere('slot.endTime > :rangeStart', { rangeStart })
      .orderBy('slot.startTime', 'ASC')
      .getMany();

    const bookings = tutorProspectId
      ? await this.bookingRepository
          .createQueryBuilder('booking')
          .where('booking.tutorProfileId = :tutorProspectId', {
            tutorProspectId,
          })
          .andWhere('booking.status NOT IN (:...excluded)', {
            excluded: [BookingStatus.CANCELLED, BookingStatus.COMPLETED],
          })
          .andWhere('booking.startTime < :rangeEnd', { rangeEnd })
          .andWhere('booking.endTime > :rangeStart', { rangeStart })
          .getMany()
      : [];

    const slots: LearnerCalendarSlot[] = [];
    const daySet = new Set<string>();

    for (const slot of availability) {
      const segments = this.splitIntoHourSegments(
        new Date(slot.startTime),
        new Date(slot.endTime),
      );

      segments.forEach((seg, index) => {
        const statusInfo = this.resolveSegmentStatus(
          seg.start,
          seg.end,
          bookings,
          options.studentId,
        );

        const dayKey = seg.start.toISOString().slice(0, 10);
        if (statusInfo.status === 'available') {
          daySet.add(dayKey);
        } else if (
          statusInfo.status === 'pending' ||
          statusInfo.status === 'booked'
        ) {
          daySet.add(dayKey);
        }

        slots.push({
          id: `${slot.id}-${index}`,
          availabilityId: slot.id,
          startTime: seg.start.toISOString(),
          endTime: seg.end.toISOString(),
          ...statusInfo,
        });
      });
    }

    return {
      slots,
      daysWithAvailability: Array.from(daySet).sort(),
    };
  }
}
