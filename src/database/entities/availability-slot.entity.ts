
import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('availability_slot')
@Index(['tutorProfileId', 'startTime', 'endTime'])
export class AvailabilitySlot extends BaseEntity {
  @Column({ name: 'tutor_profile_id' })
  @Index()
  tutorProfileId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'tutor_profile_id' })
  tutor: User;

  @Column({ type: 'timestamp' })
  @Index()
  startTime: Date;

  @Column({ type: 'timestamp' })
  endTime: Date;
}
