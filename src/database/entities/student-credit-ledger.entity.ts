import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('student_credit_ledger')
export class StudentCreditLedger extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 64 })
  source: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'booking_id', nullable: true })
  bookingId: number | null;
}
