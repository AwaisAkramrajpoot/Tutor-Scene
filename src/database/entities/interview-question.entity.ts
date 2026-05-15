import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { InterviewTopic } from './interview-topic.entity';

@Entity('interview_question')
@Index(['topicId', 'optionKey'], { unique: true })
export class InterviewQuestion extends BaseEntity {
  @Column({ name: 'topic_id' })
  topicId: number;

  @ManyToOne(() => InterviewTopic, (t) => t.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'topic_id' })
  topic: InterviewTopic;

  @Column({ name: 'option_key', type: 'varchar', length: 8 })
  optionKey: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
