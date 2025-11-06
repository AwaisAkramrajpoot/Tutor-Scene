import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GradeLevel } from '@/database/entities/grade-level.entity';
import { CreateGradeLevelDto } from './dto/create-grade-level.dto';
import { UpdateGradeLevelDto } from './dto/update-grade-level.dto';

@Injectable()
export class GradeLevelsService {
  constructor(
    @InjectRepository(GradeLevel)
    private readonly gradeLevelRepository: Repository<GradeLevel>,
  ) {}

  async create(createGradeLevelDto: CreateGradeLevelDto): Promise<GradeLevel> {
    // Check if grade level with same name already exists
    const existing = await this.gradeLevelRepository.findOne({
      where: { name: createGradeLevelDto.name },
    });

    if (existing) {
      throw new ConflictException(
        `Grade level with name "${createGradeLevelDto.name}" already exists`,
      );
    }

    try {
      const gradeLevel = this.gradeLevelRepository.create(createGradeLevelDto);
      return await this.gradeLevelRepository.save(gradeLevel);
    } catch (error) {
      throw new InternalServerErrorException('Failed to create grade level');
    }
  }

  async findAll(): Promise<GradeLevel[]> {
    try {
      return await this.gradeLevelRepository.find({
        order: { name: 'ASC' },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve grade levels');
    }
  }

  async findOne(id: number): Promise<GradeLevel> {
    const gradeLevel = await this.gradeLevelRepository.findOne({
      where: { id },
    });

    if (!gradeLevel) {
      throw new NotFoundException(`Grade level with ID ${id} not found`);
    }

    return gradeLevel;
  }

  async update(
    id: number,
    updateGradeLevelDto: UpdateGradeLevelDto,
  ): Promise<GradeLevel> {
    const gradeLevel = await this.findOne(id);

    // Check if new name conflicts with existing grade level
    if (updateGradeLevelDto.name) {
      const existing = await this.gradeLevelRepository.findOne({
        where: { name: updateGradeLevelDto.name },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Grade level with name "${updateGradeLevelDto.name}" already exists`,
        );
      }
    }

    try {
      Object.assign(gradeLevel, updateGradeLevelDto);
      return await this.gradeLevelRepository.save(gradeLevel);
    } catch (error) {
      throw new InternalServerErrorException('Failed to update grade level');
    }
  }

  async remove(id: number): Promise<void> {
    const gradeLevel = await this.findOne(id);

    try {
      await this.gradeLevelRepository.remove(gradeLevel);
    } catch (error) {
      throw new InternalServerErrorException('Failed to delete grade level');
    }
  }
}
