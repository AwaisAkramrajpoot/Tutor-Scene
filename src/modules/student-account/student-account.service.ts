import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '@/database/entities/user.entity';
import { LearnerAssessmentResponse } from '@/database/entities/learner-assessment-response.entity';
import { Booking } from '@/database/entities/booking.entity';
import { StudentReferral } from '@/database/entities/student-referral.entity';
import { StudentCreditLedger } from '@/database/entities/student-credit-ledger.entity';
import { BookingStatus } from '@/database/entities/enums';
import { MailService } from '@/modules/auth/services/mail.service';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  RELATIONSHIP_OPTIONS,
  SELF_LEARNER_LABEL,
} from './student-account.constants';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpsertLearnerDto } from './dto/upsert-learner.dto';

@Injectable()
export class StudentAccountService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(LearnerAssessmentResponse)
    private readonly learnerRepo: Repository<LearnerAssessmentResponse>,
    @InjectRepository(Booking) private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(StudentReferral)
    private readonly referralRepo: Repository<StudentReferral>,
    @InjectRepository(StudentCreditLedger)
    private readonly creditLedgerRepo: Repository<StudentCreditLedger>,
    private readonly mailService: MailService,
  ) {}

  private mapLearner(row: LearnerAssessmentResponse, includeLastName = true) {
    return {
      id: row.id,
      learnerLabel: row.learnerLabel,
      learnerFirstName: row.learnerFirstName,
      learnerLastName: includeLastName ? row.learnerLastName : undefined,
      gradeLevel: row.gradeLevel,
      gender: row.gender,
      relationshipToLearner: row.relationshipToLearner,
      avatarIcon: row.avatarIcon,
      isSelf: row.isSelf,
      status: row.status,
      profileStatus: row.profileStatus,
      updatedAt: row.updatedAt,
    };
  }

  private async notifyChange(user: User, summary: string) {
    await this.mailService.sendAccountChangeEmail(
      user.email,
      user.firstName,
      summary,
    );
  }

  private getNotificationPrefs(user: User) {
    return {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...(user.notificationPreferences || {}),
    };
  }

  async getAccountSettings(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return {
      profile: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        emailVerified: user.emailVerified,
        phoneNumber: user.phoneNumber,
        phoneVerified: user.phoneVerified,
      },
      security: {
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
      },
      notificationPreferences: this.getNotificationPrefs(user),
    };
  }

  async updateAccount(userId: number, dto: UpdateAccountDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (dto.phoneNumber !== undefined) {
      user.phoneNumber = dto.phoneNumber;
      await this.userRepo.save(user);
      await this.notifyChange(user, 'Phone number was updated.');
    }
    return this.getAccountSettings(userId);
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const changes: string[] = [];
    if (dto.gender !== undefined) {
      user.gender = dto.gender;
      changes.push('Gender');
    }
    if (dto.avatarIcon !== undefined) {
      user.avatarIcon = dto.avatarIcon;
      changes.push('Profile avatar');
    }
    if (dto.registersSelfAsLearner !== undefined) {
      user.registersSelfAsLearner = dto.registersSelfAsLearner;
      changes.push('Learner registration (Self)');
      if (dto.registersSelfAsLearner) {
        await this.syncSelfLearner(user);
      }
    }
    await this.userRepo.save(user);
    if (changes.length) {
      await this.notifyChange(user, changes.join(', ') + ' updated on Profile.');
    }
    return {
      firstName: user.firstName,
      lastName: user.lastName,
      gender: user.gender,
      avatarIcon: user.avatarIcon,
      registersSelfAsLearner: user.registersSelfAsLearner,
    };
  }

  private async syncSelfLearner(user: User) {
    let row = await this.learnerRepo.findOne({
      where: { userId: user.id, learnerLabel: SELF_LEARNER_LABEL },
    });
    if (!row) {
      row = this.learnerRepo.create({
        userId: user.id,
        learnerLabel: SELF_LEARNER_LABEL,
        answers: {},
        status: 'completed',
        profileStatus: 'profile',
        isSelf: true,
        learnerFirstName: user.firstName,
        learnerLastName: user.lastName,
        relationshipToLearner: 'Self',
        avatarIcon: user.avatarIcon,
      });
    } else {
      row.isSelf = true;
      row.learnerFirstName = user.firstName;
      row.learnerLastName = user.lastName;
      row.relationshipToLearner = 'Self';
      row.profileStatus = 'profile';
      row.status = 'completed';
    }
    await this.learnerRepo.save(row);
  }

  async updateNotificationPreferences(
    userId: number,
    prefs: Record<string, unknown>,
  ) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    user.notificationPreferences = {
      ...this.getNotificationPrefs(user),
      ...prefs,
    };
    await this.userRepo.save(user);
    await this.notifyChange(user, 'Notification preferences were updated.');
    return this.getNotificationPrefs(user);
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'email', 'firstName', 'passwordHash'],
    });
    if (!user) throw new NotFoundException('User not found');
    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('New password must be different');
    }
    user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepo.save(user);
    await this.notifyChange(user, 'Your password was changed.');
    return { success: true };
  }

  async setTwoFactor(userId: number, enabled: boolean) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    user.twoFactorEnabled = enabled;
    await this.userRepo.save(user);
    await this.notifyChange(
      user,
      enabled
        ? 'Two-factor authentication was enabled.'
        : 'Two-factor authentication was disabled.',
    );
    return { twoFactorEnabled: user.twoFactorEnabled };
  }

  async listLearners(userId: number) {
    const rows = await this.learnerRepo
      .createQueryBuilder('l')
      .where('l.user_id = :userId', { userId })
      .andWhere('(l.profile_status = :profile OR l.status = :completed)', {
        profile: 'profile',
        completed: 'completed',
      })
      .orderBy('l.is_self', 'DESC')
      .addOrderBy('l.updated_at', 'DESC')
      .getMany();
    const seen = new Set<string>();
    const unique = rows.filter((r) => {
      if (seen.has(r.learnerLabel)) return false;
      seen.add(r.learnerLabel);
      return true;
    });
    return {
      learners: unique.map((r) => this.mapLearner(r)),
      relationshipOptions: RELATIONSHIP_OPTIONS,
    };
  }

  async upsertLearner(userId: number, dto: UpsertLearnerDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const isSelf = Boolean(dto.isSelf);
    const label =
      isSelf
        ? SELF_LEARNER_LABEL
        : dto.learnerLabel ||
          `learner_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    let row = await this.learnerRepo.findOne({
      where: { userId, learnerLabel: label },
    });
    if (!row) {
      row = this.learnerRepo.create({
        userId,
        learnerLabel: label,
        answers: {},
        status: 'completed',
        profileStatus: 'profile',
      });
    }
    row.learnerFirstName = dto.learnerFirstName;
    row.learnerLastName = dto.learnerLastName ?? null;
    row.gradeLevel = dto.gradeLevel ?? null;
    row.gender = dto.gender ?? null;
    row.relationshipToLearner = isSelf
      ? 'Self'
      : dto.relationshipToLearner ?? null;
    row.avatarIcon = dto.avatarIcon ?? null;
    row.isSelf = isSelf;
    row.profileStatus = 'profile';
    row.status = 'completed';
    await this.learnerRepo.save(row);
    await this.notifyChange(
      user,
      isSelf
        ? 'Your self learner profile was saved.'
        : `Learner "${dto.learnerFirstName}" was saved.`,
    );
    return this.mapLearner(row);
  }

  async getRemovalPreview(userId: number, learnerLabel: string) {
    const learner = await this.learnerRepo.findOne({
      where: { userId, learnerLabel },
    });
    if (!learner) throw new NotFoundException('Learner not found');
    if (learner.isSelf) {
      throw new BadRequestException('Cannot remove your self profile from here');
    }
    const now = new Date();
    const sessions = await this.bookingRepo.find({
      where: {
        studentProfileId: userId,
        learnerLabel,
        status: In([BookingStatus.CONFIRMED, BookingStatus.TUTOR_REVIEW]),
        startTime: MoreThan(now),
      },
      relations: ['subject', 'tutor'],
      order: { startTime: 'ASC' },
    });
    return {
      learner: this.mapLearner(learner),
      hasUpcomingSessions: sessions.length > 0,
      sessions: sessions.map((b) => ({
        id: b.id,
        referenceNumber: b.referenceNumber,
        startTime: b.startTime,
        endTime: b.endTime,
        status: b.status,
        subjectName: b.subject?.name || 'Session',
        tutorName: b.tutor?.fullName || 'Tutor',
        gradeLevel: learner.gradeLevel,
        learnerFirstName: learner.learnerFirstName,
        learnerLastName: learner.learnerLastName,
      })),
    };
  }

  async removeLearner(
    userId: number,
    learnerLabel: string,
    cancelSessions = false,
  ) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const preview = await this.getRemovalPreview(userId, learnerLabel);
    if (preview.hasUpcomingSessions && !cancelSessions) {
      throw new BadRequestException(
        'Upcoming sessions exist. Confirm cancellation to remove this learner.',
      );
    }
    if (cancelSessions && preview.sessions.length) {
      for (const s of preview.sessions) {
        const booking = await this.bookingRepo.findOne({
          where: { id: s.id },
        });
        if (!booking) continue;
        if (booking.status === BookingStatus.CONFIRMED) {
          booking.status = BookingStatus.CANCELLED;
          booking.cancelledAt = new Date();
          booking.cancelledBy = userId;
          booking.cancellationReason = 'Learner removed from account';
        } else if (booking.status === BookingStatus.TUTOR_REVIEW) {
          booking.status = BookingStatus.CANCELLED;
          booking.cancelledAt = new Date();
          booking.cancelledBy = userId;
          booking.cancellationReason = 'Learner removed from account';
        }
        await this.bookingRepo.save(booking);
      }
    }
    await this.learnerRepo.delete({ userId, learnerLabel });
    await this.notifyChange(
      user,
      `Learner "${preview.learner.learnerFirstName}" was removed from your account.`,
    );
    return { success: true };
  }

  getProfilePageData(userId: number) {
    return this.listLearners(userId);
  }

  private generateReferralCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 7; i += 1) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  private async ensureReferralCode(user: User): Promise<string> {
    if (user.referralCode) return user.referralCode;
    let code = this.generateReferralCode();
    let exists = await this.userRepo.findOne({ where: { referralCode: code } });
    while (exists) {
      code = this.generateReferralCode();
      exists = await this.userRepo.findOne({ where: { referralCode: code } });
    }
    user.referralCode = code;
    await this.userRepo.save(user);
    return code;
  }

  async getCreditsReferrals(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const referralCode = await this.ensureReferralCode(user);
    const frontendBase =
      process.env.FRONTEND_URL || 'https://tutorscene.com';

    const referrals = await this.referralRepo.find({
      where: { referrerUserId: userId },
      order: { createdAt: 'DESC' },
      take: 20,
    });

    const referredUsers = referrals.length
      ? await this.userRepo.find({
          where: { id: In(referrals.map((r) => r.referredUserId).filter(Boolean) as number[]) },
        })
      : [];

    const userById = new Map(referredUsers.map((u) => [u.id, u]));

    const referralHistory = await Promise.all(
      referrals.map(async (row) => {
        const referred = row.referredUserId
          ? userById.get(row.referredUserId)
          : null;
        return {
          id: row.id,
          dateTime: row.createdAt,
          subject: row.subjectLabel || 'Referral',
          sessionId: row.sessionId,
          learnerId: row.referredUserId,
          learnerName: referred
            ? `${referred.firstName} ${referred.lastName}`
            : row.referredEmail || 'Pending signup',
          status: row.status,
          rewardAmount: Number(row.rewardAmount),
        };
      }),
    );

    const referralSummary = referralHistory.slice(0, 6).map((r) => ({
      id: r.id,
      date: r.dateTime,
      name: r.learnerName,
      status: r.status,
    }));

    const pendingLedger = await this.creditLedgerRepo
      .createQueryBuilder('ledger')
      .select('COALESCE(SUM(ledger.amount), 0)', 'total')
      .where('ledger.user_id = :userId', { userId })
      .andWhere("ledger.source IN ('grace_refund_pending', 'referral_pending')")
      .getRawOne();

    let pendingBalance = Number(pendingLedger?.total || 0);

    const gracePending = await this.bookingRepo.find({
      where: {
        studentProfileId: userId,
        status: BookingStatus.CANCELLED,
        refundEligible: true,
        hasRefunded: false,
      },
      take: 20,
    });
    for (const b of gracePending) {
      const amount = Number(b.finalPrice ?? b.totalPrice ?? 0);
      const alreadyCredited = await this.creditLedgerRepo.findOne({
        where: { bookingId: b.id, userId, source: 'grace_refund' },
      });
      if (!alreadyCredited && amount > 0) {
        pendingBalance += amount;
      }
    }

    const availableCredits = Number(user.availableCredits || 0);

    return {
      availableCredits,
      availableBalance: availableCredits,
      pendingBalance,
      referralCode,
      referralLink: `${frontendBase}/signup?ref=${referralCode}`,
      referredByApplied: Boolean(user.referredByUserId),
      referralHistory,
      referralSummary,
      howItWorks: [
        'Share your unique referral code or referral link with future learners on social media or anywhere.',
        'Earn $5 per referral when someone signs up using your code and completes their first session.',
        'Rewards are added to your Available Credits.',
      ],
    };
  }

  async applyReferralCode(userId: number, code: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.referredByUserId) {
      throw new BadRequestException('A referral code has already been applied.');
    }
    const normalized = code.trim().toUpperCase();
    if (!normalized) throw new BadRequestException('Referral code is required.');

    const referrer = await this.userRepo.findOne({
      where: { referralCode: normalized },
    });
    if (!referrer) throw new BadRequestException('Invalid referral code.');
    if (referrer.id === userId) {
      throw new BadRequestException('You cannot use your own referral code.');
    }

    user.referredByUserId = referrer.id;
    await this.userRepo.save(user);

    await this.referralRepo.save(
      this.referralRepo.create({
        referrerUserId: referrer.id,
        referredUserId: user.id,
        referredEmail: user.email,
        status: 'in_progress',
      }),
    );

    return this.getCreditsReferrals(userId);
  }

  async getSessionHistory(
    userId: number,
    status?: string,
    sort: 'newest' | 'oldest' = 'newest',
  ) {
    const qb = this.bookingRepo
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.tutor', 'tutor')
      .leftJoinAndSelect('booking.subject', 'subject')
      .where('booking.studentProfileId = :userId', { userId });

    if (status && status !== 'all') {
      if (status === 'upcoming') {
        qb.andWhere('booking.status = :st', { st: BookingStatus.CONFIRMED }).andWhere(
          'booking.startTime > :now',
          { now: new Date() },
        );
      } else {
        qb.andWhere('booking.status = :st', {
          st:
            status === 'cancelled'
              ? BookingStatus.CANCELLED
              : BookingStatus.COMPLETED,
        });
      }
    } else {
      qb.andWhere('booking.status IN (:...statuses)', {
        statuses: [
          BookingStatus.CONFIRMED,
          BookingStatus.COMPLETED,
          BookingStatus.CANCELLED,
          BookingStatus.PENDING,
        ],
      });
    }

    qb.orderBy(
      'booking.startTime',
      sort === 'oldest' ? 'ASC' : 'DESC',
    );

    const rows = await qb.take(100).getMany();

    return rows.map((b) => ({
      id: b.id,
      sessionId: b.referenceNumber || `TS-${b.id}`,
      dateTime: b.startTime,
      subject: b.subject?.name || 'Session',
      tutorName: b.tutor?.fullName || 'Tutor',
      learnerLabel: b.learnerLabel,
      sessionTotal: Number(b.finalPrice ?? b.totalPrice ?? 0),
      status: b.status,
      paymentStatus:
        b.status === BookingStatus.COMPLETED
          ? 'cleared'
          : b.status === BookingStatus.CANCELLED && b.hasRefunded
            ? 'refunded'
            : b.status === BookingStatus.PENDING
              ? 'pending'
              : 'cleared',
    }));
  }
}
