import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('prospects')
export class Prospect {
  @PrimaryGeneratedColumn()
  id: number;

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}