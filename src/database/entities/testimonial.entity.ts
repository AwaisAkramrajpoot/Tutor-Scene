import { Entity, Column, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity('testimonials')
export class Testimonial {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  testimonial: string;

  @Column({ type: 'varchar', length: 255, name: 'testimonial_by' })
  testimonialBy: string;

  @Column({ type: 'int', nullable: true })
  rating: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
