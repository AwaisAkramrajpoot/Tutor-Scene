import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('availability_slot')
export class AvailabilitySlot extends BaseEntity {
  @Column({ name: 'tutor_profile_id' })
  tutorProfileId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'tutor_profile_id' })
  tutor: User;

  @Column({ type: 'varchar', length: 10 })
  dayOfWeek: string; // MONDAY, TUESDAY, etc.

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({ type: 'boolean', default: true })
  isRecurring: boolean;

  @Column({ type: 'date', nullable: true })
  specificDate: Date;

  @Column({ type: 'boolean', default: true })
  isAvailable: boolean;
}
