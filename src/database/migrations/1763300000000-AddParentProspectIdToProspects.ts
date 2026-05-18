import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddParentProspectIdToProspects1763300000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "prospects"
      ADD COLUMN IF NOT EXISTS "parent_prospect_id" integer
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "prospects"
        ADD CONSTRAINT "FK_prospects_parent"
        FOREIGN KEY ("parent_prospect_id") REFERENCES "prospects"("id") ON DELETE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_prospects_parent_prospect_id"
      ON "prospects" ("parent_prospect_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_prospects_parent_prospect_id"`);
    await queryRunner.query(`
      ALTER TABLE "prospects" DROP CONSTRAINT IF EXISTS "FK_prospects_parent"
    `);
    await queryRunner.query(`
      ALTER TABLE "prospects" DROP COLUMN IF EXISTS "parent_prospect_id"
    `);
  }
}
