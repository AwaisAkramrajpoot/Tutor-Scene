import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('learner_assessment_response')
@Index(['userId', 'learnerLabel'], { unique: true })
export class LearnerAssessmentResponse extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'learner_label', length: 120 })
  learnerLabel: string;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  answers: Record<string, string>;

  @Column({ type: 'varchar', length: 20 })
  status: string;

  @Column({ name: 'learner_first_name', length: 100, nullable: true })
  learnerFirstName: string | null;

  @Column({ name: 'grade_level', length: 80, nullable: true })
  gradeLevel: string | null;

  @Column({ name: 'gender', length: 40, nullable: true })
  gender: string | null;

  @Column({ name: 'relationship_to_learner', length: 80, nullable: true })
  relationshipToLearner: string | null;
}
