import { MigrationInterface, QueryRunner } from 'typeorm';

export class SimplifyNotificationTable1731360000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new notification column as nullable first
    await queryRunner.query(`ALTER TABLE "notification" ADD COLUMN IF NOT EXISTS "notification" TEXT`);
    
    // Migrate existing data: combine title and message into notification field
    await queryRunner.query(`
      UPDATE "notification" 
      SET "notification" = COALESCE("title", '') || ': ' || COALESCE("message", '')
      WHERE "notification" IS NULL
    `);
    
    // Now make it NOT NULL with a default
    await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "notification" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "notification" SET DEFAULT ''`);
    
    // Drop old columns
    await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN IF EXISTS "type"`);
    await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN IF EXISTS "title"`);
    await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN IF EXISTS "message"`);
    await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN IF EXISTS "is_read"`);
    await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN IF EXISTS "read_at"`);
    await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN IF EXISTS "is_sent"`);
    await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN IF EXISTS "channel"`);
    await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN IF EXISTS "action_url"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse migration - add back old columns
    await queryRunner.query(`ALTER TABLE "notification" ADD COLUMN IF NOT EXISTS "type" VARCHAR(50)`);
    await queryRunner.query(`ALTER TABLE "notification" ADD COLUMN IF NOT EXISTS "title" VARCHAR(255)`);
    await queryRunner.query(`ALTER TABLE "notification" ADD COLUMN IF NOT EXISTS "message" TEXT`);
    await queryRunner.query(`ALTER TABLE "notification" ADD COLUMN IF NOT EXISTS "is_read" BOOLEAN DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "notification" ADD COLUMN IF NOT EXISTS "read_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "notification" ADD COLUMN IF NOT EXISTS "is_sent" BOOLEAN DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "notification" ADD COLUMN IF NOT EXISTS "channel" VARCHAR(50)`);
    await queryRunner.query(`ALTER TABLE "notification" ADD COLUMN IF NOT EXISTS "action_url" TEXT`);
    
    // Drop notification column
    await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN IF EXISTS "notification"`);
  }
}
