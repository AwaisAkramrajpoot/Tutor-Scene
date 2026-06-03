import { Column, Entity, Index, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { OnDemandContent } from './on-demand-content.entity';

@Entity('on_demand_cart_item')
@Unique(['userId', 'contentId'])
export class OnDemandCartItem extends BaseEntity {
  @Column({ type: 'int', name: 'user_id' })
  @Index()
  userId: number;

  @Column({ type: 'int', name: 'content_id' })
  contentId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => OnDemandContent, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'content_id' })
  content: OnDemandContent;
}
