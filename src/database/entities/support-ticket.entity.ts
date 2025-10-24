import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { TicketStatus, TicketPriority } from './enums';

@Entity('support_ticket')
export class SupportTicket extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 255 })
  subject: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.OPEN })
  status: TicketStatus;

  @Column({ type: 'enum', enum: TicketPriority, default: TicketPriority.MEDIUM })
  priority: TicketPriority;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string;

  @Column({ type: 'int', nullable: true, name: 'assigned_to' })
  assignedTo: number;

  @Column({ type: 'timestamp', nullable: true, name: 'resolved_at' })
  resolvedAt: Date;

  @Column({ type: 'text', nullable: true, name: 'resolution_notes' })
  resolutionNotes: string;

  @Column({ type: 'text', nullable: true, name: 'attachment_url' })
  attachmentUrl: string;
}
