import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { ReferralStatus } from './enums';

@Entity('referral')
export class Referral extends BaseEntity {
  @Column({ name: 'referrer_id' })
  @Index()
  referrerId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'referrer_id' })
  referrer: User;

  @Column({ name: 'referred_user_id', nullable: true })
  @Index()
  referredUserId: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'referred_user_id' })
  referredUser: User | null;

  @Column({ type: 'varchar', length: 12, name: 'referral_code' })
  referralCode: string;

  @Column({ type: 'enum', enum: ReferralStatus, default: ReferralStatus.PENDING })
  @Index()
  status: ReferralStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'spend_total' })
  spendTotal: number;
}
