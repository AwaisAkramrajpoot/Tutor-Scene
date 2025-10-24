import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AvailabilitySlot } from '@/database/entities/availability-slot.entity';
import { CreateAvailabilitySlotDto } from './dto/create-availability-slot.dto';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(AvailabilitySlot)
    private readonly availabilityRepository: Repository<AvailabilitySlot>,
  ) {}

  async create(createDto: CreateAvailabilitySlotDto, tutorProfileId: number): Promise<AvailabilitySlot> {
    const slot = this.availabilityRepository.create({
      ...createDto,
      tutorProfileId,
    });
    return this.availabilityRepository.save(slot);
  }

  async findByTutor(tutorProfileId: number): Promise<AvailabilitySlot[]> {
    return this.availabilityRepository.find({
      where: { tutorProfileId, isAvailable: true },
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
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
    Object.assign(slot, updateDto);
    return this.availabilityRepository.save(slot);
  }

  async delete(id: number): Promise<void> {
    const slot = await this.findOne(id);
    await this.availabilityRepository.remove(slot);
  }
}
