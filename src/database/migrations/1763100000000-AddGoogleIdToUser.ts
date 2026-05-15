import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGoogleIdToUser1763100000000 implements MigrationInterface {
  name = 'AddGoogleIdToUser1763100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "google_id" VARCHAR(255)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN IF EXISTS "google_id"`
    );
  }
}