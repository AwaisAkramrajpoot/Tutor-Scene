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
}
