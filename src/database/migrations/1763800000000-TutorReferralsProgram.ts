import { MigrationInterface, QueryRunner } from 'typeorm';

export class TutorReferralsProgram1763800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "referral_status_enum" AS ENUM ('pending', 'in_progress', 'completed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    const hasReferralCodeColumn = await queryRunner.hasColumn('user', 'referral_code');
    if (!hasReferralCodeColumn) {
      await queryRunner.query(`
        ALTER TABLE "user"
        ADD COLUMN "referral_code" character varying(12) UNIQUE;
      `);
    }

    const hasReferralTable = await queryRunner.hasTable('referral');
    if (!hasReferralTable) {
      await queryRunner.query(`
        CREATE TABLE "referral" (
          "id" SERIAL NOT NULL,
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          "referrer_id" integer NOT NULL,
          "referred_user_id" integer,
          "referral_code" character varying(12) NOT NULL,
          "status" "referral_status_enum" NOT NULL DEFAULT 'pending',
          "spend_total" decimal(10,2) NOT NULL DEFAULT 0,
          CONSTRAINT "PK_referral" PRIMARY KEY ("id"),
          CONSTRAINT "FK_referral_referrer" FOREIGN KEY ("referrer_id") REFERENCES "user"("id") ON DELETE CASCADE,
          CONSTRAINT "FK_referral_referred_user" FOREIGN KEY ("referred_user_id") REFERENCES "user"("id") ON DELETE SET NULL
        );
      `);

      await queryRunner.query(`
        CREATE INDEX "IDX_referral_referrer_id" ON "referral" ("referrer_id");
      `);
      await queryRunner.query(`
        CREATE INDEX "IDX_referral_referred_user_id" ON "referral" ("referred_user_id");
      `);
      await queryRunner.query(`
        CREATE INDEX "IDX_referral_status" ON "referral" ("status");
      `);
    }

    const hasSettingsTable = await queryRunner.hasTable('referral_program_settings');
    if (!hasSettingsTable) {
      await queryRunner.query(`
        CREATE TABLE "referral_program_settings" (
          "id" SERIAL NOT NULL,
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          "how_it_works_title" character varying(255) NOT NULL DEFAULT 'How It Works',
          "how_it_works_subtitle" character varying(255) NOT NULL DEFAULT 'Share Your Code',
          "how_it_works_body" text NOT NULL DEFAULT 'Share your unique referral code with future learner or prospective tutor on social media or anywhere.',
          "earn_title" character varying(255) NOT NULL DEFAULT 'Earn $15 Each Referral',
          "earn_body" text NOT NULL DEFAULT 'When future learner signs up using your code and spends their first $100, you receive a $15 reward (one-time). When prospective tutor books at least $100 of sessions you receive a $15 reward.',
          "referrals_title" character varying(255) NOT NULL DEFAULT 'Referrals',
          "referrals_subtitle" character varying(255) NOT NULL DEFAULT 'Invite friends and earn rewards',
          "referral_code_title" character varying(255) NOT NULL DEFAULT 'Your Referral Code',
          "referral_link_title" character varying(255) NOT NULL DEFAULT 'Your Referral Link',
          "referral_share_hint" text NOT NULL DEFAULT 'Click the link or copy button to share - when friends sign-up using it, you''ll both benefit!',
          "terms_url" character varying(500) NOT NULL DEFAULT '/referrals',
          CONSTRAINT "PK_referral_program_settings" PRIMARY KEY ("id")
        );
      `);

      await queryRunner.query(`
        INSERT INTO "referral_program_settings" ("id")
        SELECT 1
        WHERE NOT EXISTS (SELECT 1 FROM "referral_program_settings" WHERE "id" = 1);
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "referral_program_settings" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "referral" CASCADE`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "referral_code"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "referral_status_enum" CASCADE`);
  }
}
