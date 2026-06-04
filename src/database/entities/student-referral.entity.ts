import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('student_referral')
export class StudentReferral extends BaseEntity {
  @Column({ name: 'referrer_user_id' })
  referrerUserId: number;

  @Column({ name: 'referred_user_id', nullable: true })
  referredUserId: number | null;

  @Column({ name: 'referred_email', nullable: true })
  referredEmail: string | null;

  @Column({ length: 32, default: 'in_progress' })
  status: string;

  @Column({ name: 'reward_amount', type: 'decimal', precision: 10, scale: 2, default: 5 })
  rewardAmount: number;

  @Column({ name: 'session_id', nullable: true })
  sessionId: number | null;

  @Column({ name: 'subject_label', nullable: true })
  subjectLabel: string | null;
}
