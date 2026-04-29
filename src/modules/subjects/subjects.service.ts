import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from '@/database/entities/subject.entity';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { CatalogSubject, DEFAULT_SUBJECT_CATALOG } from './default-subject-catalog';

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

  private normalizeSubject(
    subject: Subject | CatalogSubject,
  ): CatalogSubject {
    const gradeLevels =
      'gradeLevels' in subject && Array.isArray(subject.gradeLevels)
        ? subject.gradeLevels
        : [];

    return {
      id: subject.id,
      name: subject.name,
      category: subject.category || 'General',
      gradeLevels,
    };
  }

  async findAll(filters?: {
    category?: string;
    keyword?: string;
    gradeLevel?: string;
  }): Promise<CatalogSubject[]> {
    const dbSubjects = await this.subjectRepository.find({ order: { name: 'ASC' } });
    const mergedByName = new Map<string, CatalogSubject>();
    for (const item of DEFAULT_SUBJECT_CATALOG) {
      mergedByName.set(item.name.toLowerCase(), item);
    }
    for (const db of dbSubjects.map((s) => this.normalizeSubject(s))) {
      mergedByName.set(db.name.toLowerCase(), db);
    }
    const source = Array.from(mergedByName.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );

    const category = (filters?.category || '').trim().toLowerCase();
    const keyword = (filters?.keyword || '').trim().toLowerCase();
    const gradeLevel = (filters?.gradeLevel || '').trim().toLowerCase();

    return source.filter((subject) => {
      if (category && category !== 'all' && subject.category.toLowerCase() !== category) {
        return false;
      }
      if (
        gradeLevel &&
        gradeLevel !== 'all' &&
        !subject.gradeLevels.some((gl) => gl.toLowerCase() === gradeLevel)
      ) {
        return false;
      }
      if (
        keyword &&
        !subject.name.toLowerCase().includes(keyword) &&
        !subject.category.toLowerCase().includes(keyword)
      ) {
        return false;
      }
      return true;
    });
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

  async findByCategory(category: string): Promise<CatalogSubject[]> {
    return this.findAll({ category });
  }
}
