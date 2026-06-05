import { MigrationInterface, QueryRunner } from 'typeorm';

export class StudentCreditsReferrals1763610000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user"
      ADD COLUMN IF NOT EXISTS "available_credits" numeric(10,2) NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "referral_code" varchar(32),
      ADD COLUMN IF NOT EXISTS "referred_by_user_id" integer
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_user_referral_code"
      ON "user" ("referral_code")
      WHERE "referral_code" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "student_referral" (
        "id" SERIAL PRIMARY KEY,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "referrer_user_id" integer NOT NULL,
        "referred_user_id" integer,
        "referred_email" varchar(255),
        "status" varchar(32) NOT NULL DEFAULT 'in_progress',
        "reward_amount" numeric(10,2) NOT NULL DEFAULT 5,
        "session_id" integer,
        "subject_label" varchar(128)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "student_credit_ledger" (
        "id" SERIAL PRIMARY KEY,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "user_id" integer NOT NULL,
        "amount" numeric(10,2) NOT NULL,
        "source" varchar(64) NOT NULL,
        "description" text,
        "booking_id" integer
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "student_credit_ledger"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "student_referral"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_referral_code"`);
    await queryRunner.query(`
      ALTER TABLE "user"
      DROP COLUMN IF EXISTS "available_credits",
      DROP COLUMN IF EXISTS "referral_code",
      DROP COLUMN IF EXISTS "referred_by_user_id"
    `);
  }
}
