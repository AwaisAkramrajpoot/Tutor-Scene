import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Booking } from './booking.entity';

@Entity('video_session')
export class VideoSession extends BaseEntity {
  @Column({ name: 'booking_id' })
  bookingId: number;

  @ManyToOne(() => Booking)
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ type: 'varchar', length: 255, name: 'zoom_meeting_id', nullable: true })
  zoomMeetingId: string;

  @Column({ type: 'varchar', length: 500, name: 'join_url' })
  joinUrl: string;

  @Column({ type: 'varchar', length: 500, name: 'start_url', nullable: true })
  startUrl: string;

  @Column({ type: 'varchar', length: 255, name: 'meeting_password', nullable: true })
  meetingPassword: string;

  @Column({ type: 'timestamp', nullable: true, name: 'started_at' })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'ended_at' })
  endedAt: Date;

  @Column({ type: 'int', nullable: true, name: 'duration_minutes' })
  durationMinutes: number;

  @Column({ type: 'varchar', length: 500, name: 'recording_url', nullable: true })
  recordingUrl: string;

  @Column({ type: 'boolean', default: false, name: 'recording_consent' })
  recordingConsent: boolean;
}
