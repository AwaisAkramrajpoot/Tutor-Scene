import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { BackgroundCheckStatus } from './enums';

@Entity('background_check')
export class BackgroundCheck extends BaseEntity {
  @Column({ name: 'tutor_profile_id' })
  tutorProfileId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'tutor_profile_id' })
  tutor: User;

  @Column({ type: 'varchar', length: 255, name: 'checkr_candidate_id', nullable: true })
  checkrCandidateId: string;

  @Column({ type: 'varchar', length: 255, name: 'checkr_report_id', nullable: true })
  checkrReportId: string;

  @Column({ type: 'enum', enum: BackgroundCheckStatus, default: BackgroundCheckStatus.PENDING })
  status: BackgroundCheckStatus;

  @Column({ type: 'timestamp', nullable: true, name: 'initiated_at' })
  initiatedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completedAt: Date;

  @Column({ type: 'text', nullable: true, name: 'report_url' })
  reportUrl: string;

  @Column({ type: 'text', nullable: true, name: 'failure_reason' })
  failureReason: string;
}
