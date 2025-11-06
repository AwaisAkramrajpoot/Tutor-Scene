import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('grade_level')
export class GradeLevel extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;
}
