import { Entity, Column, OneToOne, OneToMany, Index } from 'typeorm';
import { Exclude } from 'class-transformer';
import { BaseEntity } from './base.entity';
import { UserRole, UserStatus } from './enums';

@Entity('user')
export class User extends BaseEntity {
  @Column({ unique: true, length: 255 })
  @Index()
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'phone_number' })
  @Index()
  phoneNumber: string;

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  @Exclude()
  passwordHash: string;

  @Column({ type: 'varchar', length: 100, name: 'first_name' })
  firstName: string;

  @Column({ type: 'varchar', length: 100, name: 'last_name' })
  lastName: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.STUDENT })
  @Index()
  role: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.PENDING })
  @Index()
  status: UserStatus;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'profile_photo_url' })
  profilePhotoUrl: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  gender: string;

  @Column({ type: 'boolean', default: false, name: 'two_factor_enabled' })
  twoFactorEnabled: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'two_factor_secret' })
  @Exclude()
  twoFactorSecret: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'stripe_connected_account_id' })
  stripeConnectedAccountId: string;

  @Column({ type: 'boolean', default: false, name: 'stripe_onboarding_complete' })
  stripeOnboardingComplete: boolean;

  @Column({ type: 'text', nullable: true, name: 'google_calendar_refresh_token' })
  @Exclude()
  googleCalendarRefreshToken: string;

  @Column({ type: 'text', nullable: true, name: 'google_calendar_access_token' })
  @Exclude()
  googleCalendarAccessToken: string;

  @Column({ type: 'timestamp', nullable: true, name: 'google_calendar_token_expiry' })
  googleCalendarTokenExpiry: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'last_login_at' })
  lastLoginAt: Date;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'last_login_ip' })
  lastLoginIp: string;

  @Column({ type: 'boolean', default: false, name: 'email_verified' })
  emailVerified: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'email_verification_token' })
  @Exclude()
  emailVerificationToken: string;

  @Column({ type: 'timestamp', nullable: true, name: 'email_verified_at' })
  emailVerifiedAt: Date;

  @Column({ type: 'boolean', default: false, name: 'phone_verified' })
  phoneVerified: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'phone_verified_at' })
  phoneVerifiedAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'password_reset_token' })
  @Exclude()
  passwordResetToken: string;

  @Column({ type: 'timestamp', nullable: true, name: 'password_reset_expiry' })
  passwordResetExpiry: Date;

  @Column({ type: 'text', nullable: true, name: 'refresh_token' })
  @Exclude()
  refreshToken: string;

  @Column({ type: 'timestamp', nullable: true, name: 'deleted_at' })
  deletedAt: Date;

  @Column({ type: 'text', nullable: true, name: 'suspension_reason' })
  suspensionReason: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'google_id' })
  googleId: string;

  @Column({ type: 'varchar', length: 32, nullable: true, name: 'avatar_icon' })
  avatarIcon: string | null;

  @Column({ type: 'jsonb', nullable: true, name: 'notification_preferences' })
  notificationPreferences: Record<string, unknown> | null;

  @Column({ type: 'boolean', default: false, name: 'registers_self_as_learner' })
  registersSelfAsLearner: boolean;

  @Column({ type: 'varchar', length: 12, nullable: true, unique: true, name: 'referral_code' })
  referralCode: string | null;
  
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  isTutor(): boolean {
    return this.role === UserRole.TUTOR;
  }

  isStudent(): boolean {
    return this.role === UserRole.STUDENT;
  }

  isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }
}
