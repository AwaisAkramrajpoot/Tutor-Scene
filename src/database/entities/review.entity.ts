import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Booking } from './booking.entity';

@Entity('review')
export class Review extends BaseEntity {
  @Column({ name: 'booking_id' })
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

  @Column({ type: 'int' })
  rating: number; // 1-5

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ type: 'boolean', default: false, name: 'is_flagged' })
  isFlagged: boolean;

  @Column({ type: 'text', nullable: true, name: 'flag_reason' })
  flagReason: string;
}
