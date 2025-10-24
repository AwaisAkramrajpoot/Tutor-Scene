import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('subject')
export class Subject extends BaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string;
}
