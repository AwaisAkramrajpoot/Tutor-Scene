import { MigrationInterface, QueryRunner } from 'typeorm';

export class NotificationInboxFields1763600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "notification"
      ADD COLUMN IF NOT EXISTS "title" varchar(255),
      ADD COLUMN IF NOT EXISTS "preview" text,
      ADD COLUMN IF NOT EXISTS "type" varchar(50),
      ADD COLUMN IF NOT EXISTS "is_read" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "is_system" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "metadata" jsonb
    `);

    await queryRunner.query(`
      UPDATE "notification"
      SET
        "title" = COALESCE("title", split_part("notification", ':', 1)),
        "preview" = COALESCE("preview", "notification"),
        "type" = COALESCE("type", 'general')
      WHERE "title" IS NULL OR "preview" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "notification"
      DROP COLUMN IF EXISTS "title",
      DROP COLUMN IF EXISTS "preview",
      DROP COLUMN IF EXISTS "type",
      DROP COLUMN IF EXISTS "is_read",
      DROP COLUMN IF EXISTS "is_system",
      DROP COLUMN IF EXISTS "metadata"
    `);
  }
}
