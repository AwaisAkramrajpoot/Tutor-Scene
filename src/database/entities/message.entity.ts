import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('message')
export class Message extends BaseEntity {
  @Column({ name: 'conversation_id', nullable: true })
  @Index()
  conversationId: number;

  @ManyToOne('Conversation', 'messages')
  @JoinColumn({ name: 'conversation_id' })
  conversation: any;

  @Column({ name: 'sender_id' })
  @Index()
  senderId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @Column({ name: 'receiver_id' })
  @Index()
  receiverId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'receiver_id' })
  receiver: User;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'attachment_url' })
  attachmentUrl: string;

  @Column({ type: 'boolean', default: false, name: 'is_read' })
  @Index()
  isRead: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'read_at' })
  readAt: Date;

  @Column({ type: 'int', nullable: true, name: 'booking_id' })
  bookingId: number;
}
