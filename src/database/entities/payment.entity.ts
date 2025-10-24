import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Booking } from './booking.entity';
import { PaymentStatus } from './enums';

@Entity('payment_transaction')
export class Payment extends BaseEntity {
  @Column({ name: 'booking_id', nullable: true })
  bookingId: number;

  @ManyToOne(() => Booking)
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ name: 'student_profile_id' })
  studentProfileId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'student_profile_id' })
  student: User;

  @Column({ name: 'tutor_profile_id' })
  tutorProfileId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'tutor_profile_id' })
  tutor: User;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'platform_fee' })
  platformFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'tutor_payout' })
  tutorPayout: number;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'varchar', length: 255, name: 'stripe_payment_intent_id', nullable: true })
  stripePaymentIntentId: string;

  @Column({ type: 'varchar', length: 255, name: 'stripe_charge_id', nullable: true })
  stripeChargeId: string;

  @Column({ type: 'varchar', length: 50, name: 'payment_method' })
  paymentMethod: string;

  @Column({ type: 'text', nullable: true, name: 'failure_reason' })
  failureReason: string;

  @Column({ type: 'timestamp', nullable: true, name: 'paid_at' })
  paidAt: Date;
}
