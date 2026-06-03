import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LearnerAssessmentResponse } from '@/database/entities/learner-assessment-response.entity';
import { SaveLearnerAssessmentDto } from './dto/save-learner-assessment.dto';

@Injectable()
export class LearnerAssessmentService {
  constructor(
    @InjectRepository(LearnerAssessmentResponse)
    private readonly repo: Repository<LearnerAssessmentResponse>,
  ) {}

  async findForUserAndLearner(
    userId: number,
    learnerLabel: string,
  ): Promise<LearnerAssessmentResponse | null> {
    return this.repo.findOne({
      where: { userId, learnerLabel },
    });
  }

  async listCompleted(userId: number): Promise<LearnerAssessmentResponse[]> {
    return this.repo.find({
      where: { userId, status: 'completed' },
      order: { updatedAt: 'DESC' },
    });
  }

  async deleteForUser(userId: number, learnerLabel: string): Promise<void> {
    const row = await this.repo.findOne({
      where: { userId, learnerLabel },
    });
    if (!row) {
      throw new NotFoundException('Assessment not found');
    }
    await this.repo.remove(row);
  }

  async upsert(
    userId: number,
    dto: SaveLearnerAssessmentDto,
  ): Promise<LearnerAssessmentResponse> {
    let row = await this.repo.findOne({
      where: { userId, learnerLabel: dto.learnerLabel },
    });
    if (!row) {
      row = this.repo.create({
        userId,
        learnerLabel: dto.learnerLabel,
        answers: dto.answers || {},
        status: dto.status,
      });
    } else {
      row.answers = dto.answers || {};
      row.status = dto.status;
    }
    if (dto.learnerFirstName !== undefined) {
      row.learnerFirstName = dto.learnerFirstName ?? null;
    }
    if (dto.gradeLevel !== undefined) {
      row.gradeLevel = dto.gradeLevel ?? null;
    }
    if (dto.gender !== undefined) {
      row.gender = dto.gender ?? null;
    }
    if (dto.relationshipToLearner !== undefined) {
      row.relationshipToLearner = dto.relationshipToLearner ?? null;
    }
    if (dto.learnerLastName !== undefined) {
      row.learnerLastName = dto.learnerLastName ?? null;
    }
    if (dto.avatarIcon !== undefined) {
      row.avatarIcon = dto.avatarIcon ?? null;
    }
    return this.repo.save(row);
  }
}
