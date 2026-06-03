import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { BookingStatus } from './enums';
import { User } from './user.entity';
import { Prospect } from './prospect.entity';

@Entity('booking')
export class Booking extends BaseEntity {
  @Column({ type: 'varchar', length: 20, unique: true, nullable: true, name: 'reference_number' })
  referenceNumber: string;

  @Column({ name: 'student_profile_id' })
  studentProfileId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'student_profile_id' })
  student: User;

  @Column({ name: 'tutor_profile_id' })
  tutorProfileId: number;

  @ManyToOne(() => Prospect)
  @JoinColumn({ name: 'tutor_profile_id' })
  tutor: Prospect;

  @Column({ name: 'subject_id', nullable: true })
  subjectId: number;

  @ManyToOne('Subject', { nullable: true })
  @JoinColumn({ name: 'subject_id' })
  subject: any;

  @Column({ type: 'timestamp', name: 'start_time' })
  startTime: Date;

  @Column({ type: 'timestamp', name: 'end_time' })
  endTime: Date;

  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.TUTOR_REVIEW })
  status: BookingStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'total_price' })
  totalPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'platform_fee' })
  platformFee: number;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'stripe_payment_intent_id' })
  stripePaymentIntentId: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'zoom_meeting_id' })
  zoomMeetingId: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'zoom_join_link' })
  zoomJoinLink: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'host_start_url' })
  hostStartUrl: string;

  @Column({ type: 'timestamp', nullable: true, name: 'cancelled_at' })
  cancelledAt: Date;

  @Column({ name: 'cancelled_by', nullable: true })
  cancelledBy: number;

  @Column({ type: 'text', nullable: true, name: 'cancellation_reason' })
  cancellationReason: string;

  @Column({ type: 'boolean', default: true, name: 'refund_eligible' })
  refundEligible: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completedAt: Date;

  @Column({ type: 'boolean', default: false, name: 'review_added' })
  reviewAdded: boolean;

  @Column({ type: 'boolean', default: false, name: 'has_refunded' })
  hasRefunded: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'discount_code' })
  discountCode: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'discount_amount' })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'final_price' })
  finalPrice: number;

  @Column({ type: 'varchar', length: 120, nullable: true, name: 'learner_label' })
  learnerLabel: string | null;
}
