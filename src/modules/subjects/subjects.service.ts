import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from '@/database/entities/subject.entity';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
  ) {}

  async create(createSubjectDto: CreateSubjectDto): Promise<Subject> {
    const subject = this.subjectRepository.create(createSubjectDto);
    return this.subjectRepository.save(subject);
  }

  async findAll(): Promise<Subject[]> {
    return this.subjectRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: number): Promise<Subject> {
    const subject = await this.subjectRepository.findOne({ where: { id } });
    if (!subject) {
      throw new NotFoundException(`Subject with ID ${id} not found`);
    }
    return subject;
  }

  async update(id: number, updateSubjectDto: UpdateSubjectDto): Promise<Subject> {
    const subject = await this.findOne(id);
    Object.assign(subject, updateSubjectDto);
    return this.subjectRepository.save(subject);
  }

  async remove(id: number): Promise<void> {
    const subject = await this.findOne(id);
    await this.subjectRepository.remove(subject);
  }

  async findByCategory(category: string): Promise<Subject[]> {
    return this.subjectRepository.find({ where: { category }, order: { name: 'ASC' } });
  }
}
