import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('virtual_interview_responses')
export class VirtualInterviewResponse extends BaseEntity {
  @Column({ name: 'user_id', unique: true })
  @Index()
  userId: number;

  @Column({ type: 'jsonb', default: {} })
  responses: Record<
    string,
    {
      selectedQuestion?: string;
      videoUrl?: string | null;
      videos?: Record<string, string | null>;
    }
  >;

  @Column({ type: 'boolean', default: false })
  completed: boolean;

  @Column({ type: 'timestamp', name: 'submitted_at', nullable: true })
  submittedAt: Date | null;
}

