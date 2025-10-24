import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { KYCStatus } from './enums';

@Entity('kyc_request')
export class KYC extends BaseEntity {
  @Column({ name: 'tutor_profile_id' })
  tutorProfileId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'tutor_profile_id' })
  tutor: User;

  @Column({ type: 'varchar', length: 50, name: 'document_type' })
  documentType: string; // PASSPORT, DRIVERS_LICENSE, etc.

  @Column({ type: 'varchar', length: 500, name: 'document_url' })
  documentUrl: string;

  @Column({ type: 'enum', enum: KYCStatus, default: KYCStatus.PENDING })
  status: KYCStatus;

  @Column({ type: 'timestamp', nullable: true, name: 'submitted_at' })
  submittedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'reviewed_at' })
  reviewedAt: Date;

  @Column({ type: 'int', nullable: true, name: 'reviewed_by' })
  reviewedBy: number;

  @Column({ type: 'text', nullable: true, name: 'rejection_reason' })
  rejectionReason: string;
}
