import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProspectStatus } from './enums';
import { User } from './user.entity';

@Entity('prospects')
export class Prospect {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 5, unique: true, nullable: true, name: 'prospect_id' })
  prospectId: string;

  @Column({ nullable: true, name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  subjects: string;

  @Column()
  gradeLevels: string;

  @Column()
  yearsOfExperience: number;

  @Column({ type: 'text' })
  teachingPhilosophy: string;

  @Column({ nullable: true })
  cv: string;

  @Column({ nullable: true })
  introVideo: string;

  @Column({ nullable: true, type: 'timestamp' })
  interviewTime: Date;

  @Column()
  fullName: string;

  @Column({ type: 'date' })
  dateOfBirth: Date;

  @Column({ nullable: true })
  govId: string;

  @Column({ nullable: true })
  profilePic: string;

  @Column({ type: 'enum', enum: ProspectStatus, default: ProspectStatus.PENDING })
  status: ProspectStatus;

  @Column({ type: 'boolean', default: false, name: 'setup_complete' })
  setupComplete: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'payment_account_id' })
  paymentAccountId: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'customer_id' })
  customerId: string;

  @Column({ type: 'boolean', default: false, name: 'payment_onboarded' })
  paymentOnBoarded: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  fee: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}