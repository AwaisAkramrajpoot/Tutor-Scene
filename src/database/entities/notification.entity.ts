import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('notification')
export class Notification extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text' })
  notification: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string | null;

  @Column({ type: 'text', nullable: true })
  preview: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  type: string | null;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead: boolean;

  @Column({ name: 'is_system', type: 'boolean', default: false })
  isSystem: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;
}
