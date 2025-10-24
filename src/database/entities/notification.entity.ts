import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { NotificationType } from './enums';

@Entity('notification')
export class Notification extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'boolean', default: false, name: 'is_read' })
  isRead: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'read_at' })
  readAt: Date;

  @Column({ type: 'boolean', default: false, name: 'is_sent' })
  isSent: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  channel: string; // EMAIL, SMS, IN_APP

  @Column({ type: 'text', nullable: true, name: 'action_url' })
  actionUrl: string;
}
