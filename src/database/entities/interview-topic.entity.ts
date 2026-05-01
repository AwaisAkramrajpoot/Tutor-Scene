import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { InterviewQuestion } from './interview-question.entity';

@Entity('interview_topic')
export class InterviewTopic extends BaseEntity {
  @Column({ type: 'varchar', length: 64, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => InterviewQuestion, (q) => q.topic)
  questions: InterviewQuestion[];
}
