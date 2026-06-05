import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('referral_program_settings')
export class ReferralProgramSettings extends BaseEntity {
  @Column({ type: 'varchar', length: 255, name: 'how_it_works_title', default: 'How It Works' })
  howItWorksTitle: string;

  @Column({ type: 'varchar', length: 255, name: 'how_it_works_subtitle', default: 'Share Your Code' })
  howItWorksSubtitle: string;

  @Column({ type: 'text', name: 'how_it_works_body' })
  howItWorksBody: string;

  @Column({ type: 'varchar', length: 255, name: 'earn_title', default: 'Earn $15 Each Referral' })
  earnTitle: string;

  @Column({ type: 'text', name: 'earn_body' })
  earnBody: string;

  @Column({ type: 'varchar', length: 255, name: 'referrals_title', default: 'Referrals' })
  referralsTitle: string;

  @Column({ type: 'varchar', length: 255, name: 'referrals_subtitle', default: 'Invite friends and earn rewards' })
  referralsSubtitle: string;

  @Column({ type: 'varchar', length: 255, name: 'referral_code_title', default: 'Your Referral Code' })
  referralCodeTitle: string;

  @Column({ type: 'varchar', length: 255, name: 'referral_link_title', default: 'Your Referral Link' })
  referralLinkTitle: string;

  @Column({ type: 'text', name: 'referral_share_hint' })
  referralShareHint: string;

  @Column({ type: 'varchar', length: 500, name: 'terms_url', default: '/referrals' })
  termsUrl: string;
}
