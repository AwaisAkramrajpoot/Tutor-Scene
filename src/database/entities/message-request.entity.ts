import { Entity, Column, ManyToOne, JoinColumn, OneToOne, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { MessageRequestStatus } from './enums';

@Entity('message_request')
@Index(['studentId', 'tutorId', 'status'], { 
  unique: true,
  where: "status IN ('pending', 'accepted')"
})
export class MessageRequest extends BaseEntity {
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

  @Column({
    type: 'enum',
    enum: MessageRequestStatus,
    default: MessageRequestStatus.PENDING,
  })
  @Index()
  status: MessageRequestStatus;

  @Column({ type: 'text', nullable: true })
  message: string;

  @OneToOne('Conversation', 'messageRequest')
  conversation: any;
}
