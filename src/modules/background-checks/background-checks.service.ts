import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { BackgroundCheck } from '@/database/entities/background-check.entity';
import { BackgroundCheckStatus } from '@/database/entities/enums';

@Injectable()
export class BackgroundChecksService {
  constructor(
    @InjectRepository(BackgroundCheck)
    private readonly backgroundCheckRepository: Repository<BackgroundCheck>,
    private readonly configService: ConfigService,
  ) {}

  async initiate(tutorProfileId: number): Promise<BackgroundCheck> {
    const checkrApiKey = this.configService.get<string>('CHECKR_API_KEY');

    // Create Checkr candidate and initiate background check
    const candidateResponse = await axios.post(
      'https://api.checkr.com/v1/candidates',
      { email: `tutor-${tutorProfileId}@tutorscene.com` },
      { headers: { Authorization: `Basic ${Buffer.from(checkrApiKey + ':').toString('base64')}` } },
    );

    const reportResponse = await axios.post(
      'https://api.checkr.com/v1/reports',
      { candidate_id: candidateResponse.data.id, package: 'standard' },
      { headers: { Authorization: `Basic ${Buffer.from(checkrApiKey + ':').toString('base64')}` } },
    );

    const backgroundCheck = this.backgroundCheckRepository.create({
      tutorProfileId,
      checkrCandidateId: candidateResponse.data.id,
      checkrReportId: reportResponse.data.id,
      status: BackgroundCheckStatus.PENDING,
      initiatedAt: new Date(),
    });

    return this.backgroundCheckRepository.save(backgroundCheck);
  }

  async findByTutor(tutorProfileId: number): Promise<BackgroundCheck[]> {
    return this.backgroundCheckRepository.find({
      where: { tutorProfileId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<BackgroundCheck> {
    const check = await this.backgroundCheckRepository.findOne({ where: { id } });
    if (!check) {
      throw new NotFoundException(`Background check with ID ${id} not found`);
    }
    return check;
  }

  async updateStatus(checkrReportId: string, status: BackgroundCheckStatus): Promise<BackgroundCheck> {
    const check = await this.backgroundCheckRepository.findOne({ where: { checkrReportId } });
    if (check) {
      check.status = status;
      if (status === BackgroundCheckStatus.CLEAR || status === BackgroundCheckStatus.CONSIDER) {
        check.completedAt = new Date();
      }
      return this.backgroundCheckRepository.save(check);
    }
    return null;
  }
}
