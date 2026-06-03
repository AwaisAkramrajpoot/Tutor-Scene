import { MigrationInterface, QueryRunner } from 'typeorm';

export class StudentAccountProfileFields1763500000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user"
      ADD COLUMN IF NOT EXISTS "avatar_icon" character varying(32),
      ADD COLUMN IF NOT EXISTS "notification_preferences" jsonb,
      ADD COLUMN IF NOT EXISTS "registers_self_as_learner" boolean NOT NULL DEFAULT false;
    `);

    await queryRunner.query(`
      ALTER TABLE "learner_assessment_response"
      ADD COLUMN IF NOT EXISTS "learner_last_name" character varying(100),
      ADD COLUMN IF NOT EXISTS "avatar_icon" character varying(32),
      ADD COLUMN IF NOT EXISTS "is_self" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "profile_status" character varying(20) NOT NULL DEFAULT 'assessment';
    `);

    await queryRunner.query(`
      ALTER TABLE "booking"
      ADD COLUMN IF NOT EXISTS "learner_label" character varying(120);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "booking" DROP COLUMN IF EXISTS "learner_label";
    `);
    await queryRunner.query(`
      ALTER TABLE "learner_assessment_response"
      DROP COLUMN IF EXISTS "learner_last_name",
      DROP COLUMN IF EXISTS "avatar_icon",
      DROP COLUMN IF EXISTS "is_self",
      DROP COLUMN IF EXISTS "profile_status";
    `);
    await queryRunner.query(`
      ALTER TABLE "user"
      DROP COLUMN IF EXISTS "avatar_icon",
      DROP COLUMN IF EXISTS "notification_preferences",
      DROP COLUMN IF EXISTS "registers_self_as_learner";
    `);
  }
}
