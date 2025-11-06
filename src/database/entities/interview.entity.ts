import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { InterviewStatus } from './enums';

@Entity('interviews')
export class Interview extends BaseEntity {
  @Column({ name: 'user_id' })
  @Index()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'timestamp', name: 'start_time' })
  startTime: Date;

  @Column({ type: 'varchar', length: 255, name: 'zoom_meeting_id' })
  zoomMeetingId: string;

  @Column({ type: 'text', name: 'host_start_url' })
  hostStartUrl: string;

  @Column({ type: 'text', name: 'participant_join_url' })
  participantJoinUrl: string;

  @Column({ type: 'varchar', length: 100, name: 'meeting_password' })
  meetingPassword: string;

  @Column({ 
    type: 'enum', 
    enum: InterviewStatus, 
    default: InterviewStatus.SCHEDULED 
  })
  @Index()
  status: InterviewStatus;
}
