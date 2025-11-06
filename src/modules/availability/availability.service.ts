import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { AvailabilitySlot } from '@/database/entities/availability-slot.entity';
import { CreateAvailabilitySlotDto } from './dto/create-availability-slot.dto';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(AvailabilitySlot)
    private readonly availabilityRepository: Repository<AvailabilitySlot>,
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
}
