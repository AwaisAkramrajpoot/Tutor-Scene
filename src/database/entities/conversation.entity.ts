import { Entity, Column, ManyToOne, JoinColumn, OneToOne, OneToMany, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { MessageRequest } from './message-request.entity';

@Entity('conversation')
export class Conversation extends BaseEntity {
  @Column({ name: 'message_request_id', unique: true })
  messageRequestId: number;

  @OneToOne(() => MessageRequest, (messageRequest) => messageRequest.conversation)
  @JoinColumn({ name: 'message_request_id' })
  messageRequest: MessageRequest;

  @Column({ name: 'student_id' })
  @Index()
  studentId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ name: 'tutor_id' })
  @Index()
  tutorId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'tutor_id' })
  tutor: User;

  @Column({ type: 'timestamp', nullable: true, name: 'last_message_at' })
  @Index()
  lastMessageAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'deleted_at' })
  @Index()
  deletedAt: Date;

  @OneToMany('Message', 'conversation')
  messages: any[];
}
