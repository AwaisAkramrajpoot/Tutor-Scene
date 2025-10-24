import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KYC } from '@/database/entities/kyc.entity';
import { SubmitKYCDto } from './dto/submit-kyc.dto';
import { KYCStatus } from '@/database/entities/enums';

@Injectable()
export class KycService {
  constructor(
    @InjectRepository(KYC)
    private readonly kycRepository: Repository<KYC>,
  ) {}

  async submit(submitKYCDto: SubmitKYCDto, tutorProfileId: number): Promise<KYC> {
    const kyc = this.kycRepository.create({
      ...submitKYCDto,
      tutorProfileId,
      submittedAt: new Date(),
      status: KYCStatus.PENDING,
    });
    return this.kycRepository.save(kyc);
  }

  async findByTutor(tutorProfileId: number): Promise<KYC[]> {
    return this.kycRepository.find({ where: { tutorProfileId }, order: { createdAt: 'DESC' } });
  }

  async findOne(id: number): Promise<KYC> {
    const kyc = await this.kycRepository.findOne({ where: { id } });
    if (!kyc) {
      throw new NotFoundException(`KYC request with ID ${id} not found`);
    }
    return kyc;
  }

  async approve(id: number, reviewedBy: number): Promise<KYC> {
    const kyc = await this.findOne(id);
    kyc.status = KYCStatus.APPROVED;
    kyc.reviewedAt = new Date();
    kyc.reviewedBy = reviewedBy;
    return this.kycRepository.save(kyc);
  }

  async reject(id: number, reviewedBy: number, reason: string): Promise<KYC> {
    const kyc = await this.findOne(id);
    kyc.status = KYCStatus.REJECTED;
    kyc.reviewedAt = new Date();
    kyc.reviewedBy = reviewedBy;
    kyc.rejectionReason = reason;
    return this.kycRepository.save(kyc);
  }

  async findAll(): Promise<KYC[]> {
    return this.kycRepository.find({ order: { createdAt: 'DESC' } });
  }
}
