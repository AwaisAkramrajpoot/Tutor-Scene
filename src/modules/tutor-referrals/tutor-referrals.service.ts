import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '@/database/entities/user.entity';
import { Referral } from '@/database/entities/referral.entity';
import { ReferralProgramSettings } from '@/database/entities/referral-program-settings.entity';
import { ReferralStatus } from '@/database/entities/enums';
import { UpdateReferralProgramSettingsDto } from './dto/update-referral-program-settings.dto';
import { buildReferralLink, generateReferralCode } from './utils/referral-code.util';

const COMPLETION_THRESHOLD = 100;

@Injectable()
export class TutorReferralsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Referral)
    private readonly referralRepository: Repository<Referral>,
    @InjectRepository(ReferralProgramSettings)
    private readonly settingsRepository: Repository<ReferralProgramSettings>,
    private readonly configService: ConfigService,
  ) {}

  private getFrontendBaseUrl(): string {
    return (
      this.configService.get<string>('FRONTEND_URL') ||
      this.configService.get<string>('APP_URL') ||
      'https://tutorscene.app'
    );
  }

  async ensureReferralCode(userId: number): Promise<string> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.referralCode) {
      return user.referralCode;
    }

    let code = generateReferralCode(user.id, user.firstName);
    let attempts = 0;
    while (attempts < 5) {
      const existing = await this.userRepository.findOne({ where: { referralCode: code } });
      if (!existing) break;
      code = generateReferralCode(user.id + attempts + 1, user.firstName);
      attempts += 1;
    }

    user.referralCode = code;
    await this.userRepository.save(user);
    return code;
  }

  async getReferralCounts(referrerId: number) {
    const referrals = await this.referralRepository.find({ where: { referrerId } });
    const pending = referrals.filter((r) => r.status === ReferralStatus.PENDING).length;
    const inProgress = referrals.filter((r) => r.status === ReferralStatus.IN_PROGRESS).length;
    const completed = referrals.filter((r) => r.status === ReferralStatus.COMPLETED).length;

    return {
      totalReferrals: referrals.length,
      pending,
      inProgress,
      completed,
      referralsCompleted: completed,
    };
  }

  async getDashboardSummary(userId: number) {
    const code = await this.ensureReferralCode(userId);
    const counts = await this.getReferralCounts(userId);

    return {
      referralCode: code,
      ...counts,
    };
  }

  async getReferralProgramDetails(userId: number) {
    const code = await this.ensureReferralCode(userId);
    const counts = await this.getReferralCounts(userId);
    const content = await this.getProgramSettings();
    const referralLink = buildReferralLink(this.getFrontendBaseUrl(), code);

    return {
      referralCode: code,
      referralLink,
      counts,
      content,
    };
  }

  async getProgramSettings(): Promise<ReferralProgramSettings> {
    let settings = await this.settingsRepository.findOne({ where: { id: 1 } });
    if (!settings) {
      settings = this.settingsRepository.create({ id: 1 });
      settings = await this.settingsRepository.save(settings);
    }
    return settings;
  }

  async updateProgramSettings(dto: UpdateReferralProgramSettingsDto): Promise<ReferralProgramSettings> {
    const settings = await this.getProgramSettings();
    Object.assign(settings, {
      howItWorksTitle: dto.howItWorksTitle ?? settings.howItWorksTitle,
      howItWorksSubtitle: dto.howItWorksSubtitle ?? settings.howItWorksSubtitle,
      howItWorksBody: dto.howItWorksBody ?? settings.howItWorksBody,
      earnTitle: dto.earnTitle ?? settings.earnTitle,
      earnBody: dto.earnBody ?? settings.earnBody,
      referralsTitle: dto.referralsTitle ?? settings.referralsTitle,
      referralsSubtitle: dto.referralsSubtitle ?? settings.referralsSubtitle,
      referralCodeTitle: dto.referralCodeTitle ?? settings.referralCodeTitle,
      referralLinkTitle: dto.referralLinkTitle ?? settings.referralLinkTitle,
      referralShareHint: dto.referralShareHint ?? settings.referralShareHint,
      termsUrl: dto.termsUrl ?? settings.termsUrl,
    });
    return this.settingsRepository.save(settings);
  }

  async recordReferralOnSignup(referredUserId: number, referralCode?: string): Promise<void> {
    if (!referralCode?.trim()) return;

    const normalizedCode = referralCode.trim().toUpperCase();
    const referrer = await this.userRepository.findOne({
      where: { referralCode: normalizedCode },
    });
    if (!referrer || referrer.id === referredUserId) return;

    const existing = await this.referralRepository.findOne({
      where: { referredUserId },
    });
    if (existing) return;

    const referral = this.referralRepository.create({
      referrerId: referrer.id,
      referredUserId,
      referralCode: normalizedCode,
      status: ReferralStatus.PENDING,
      spendTotal: 0,
    });
    await this.referralRepository.save(referral);
  }

  async updateReferralSpendForUser(userId: number, amount: number): Promise<void> {
    const referral = await this.referralRepository.findOne({
      where: { referredUserId: userId },
    });
    if (!referral) return;

    const spendTotal = Number(referral.spendTotal || 0) + Number(amount || 0);
    referral.spendTotal = spendTotal;

    if (spendTotal >= COMPLETION_THRESHOLD) {
      referral.status = ReferralStatus.COMPLETED;
    } else if (spendTotal > 0) {
      referral.status = ReferralStatus.IN_PROGRESS;
    }

    await this.referralRepository.save(referral);
  }
}
