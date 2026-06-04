import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum OnDemandContentType {
  VIDEO = 'video',
  PDF = 'pdf',
  WORKSHEET = 'worksheet',
  QUIZ = 'quiz',
}

@Entity('on_demand_content')
export class OnDemandContent extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 32, name: 'content_type' })
  @Index()
  contentType: OnDemandContentType;

  @Column({ type: 'varchar', length: 120 })
  subject: string;

  @Column({ type: 'varchar', length: 80, name: 'grade_level' })
  gradeLevel: string;

  @Column({ type: 'int', name: 'duration_minutes', default: 0 })
  durationMinutes: number;

  @Column({
    type: 'decimal',
    precision: 8,
    scale: 2,
    name: 'price_per_minute',
    default: 0,
  })
  pricePerMinute: number;

  @Column({ type: 'varchar', length: 32, name: 'file_type', default: 'mp4' })
  fileType: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'thumbnail_url' })
  thumbnailUrl: string | null;

  @Column({ type: 'varchar', length: 120, name: 'tutor_name', default: 'Tutor' })
  tutorName: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'tutor_avatar_url' })
  tutorAvatarUrl: string | null;

  @Column({ type: 'int', name: 'popularity_count', default: 0 })
  popularityCount: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;
}
