import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';
import { PromoCodeDiscountType } from './enums';

@Entity('promo_code')
export class PromoCode extends BaseEntity {
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'enum', enum: PromoCodeDiscountType, name: 'discount_type' })
  discountType: PromoCodeDiscountType;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'discount_value' })
  discountValue: number;

  @Column({ type: 'timestamp', name: 'valid_from', nullable: true })
  validFrom: Date;

  @Column({ type: 'timestamp', name: 'valid_until', nullable: true })
  validUntil: Date;

  @Column({ type: 'int', nullable: true, name: 'usage_limit' })
  usageLimit: number;

  @Column({ type: 'int', default: 0, name: 'usage_count' })
  usageCount: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'min_booking_amount' })
  minBookingAmount: number;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'applicable_to' })
  applicableTo: string; // ALL, FIRST_TIME_USERS, etc.

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'stripe_coupon_id' })
  stripeCouponId: string;
}
