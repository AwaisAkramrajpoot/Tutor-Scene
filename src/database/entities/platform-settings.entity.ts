import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('platform_settings')
export class PlatformSettings extends BaseEntity {
  @Column({ type: 'int', name: 'rating_period_months', default: 3 })
  ratingPeriodMonths: number;
}
