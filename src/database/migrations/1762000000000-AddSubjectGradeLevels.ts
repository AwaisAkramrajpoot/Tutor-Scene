import { MigrationInterface, QueryRunner } from 'typeorm';
import { DEFAULT_SUBJECT_CATALOG } from '../../modules/subjects/default-subject-catalog';

export class AddSubjectGradeLevels1762000000000 implements MigrationInterface {
  name = 'AddSubjectGradeLevels1762000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('subject');
    if (!table) {
      return;
    }
    if (!table.findColumnByName('grade_levels')) {
      await queryRunner.query(`
        ALTER TABLE "subject"
        ADD COLUMN "grade_levels" jsonb NOT NULL DEFAULT '[]'::jsonb
      `);
    }
    for (const row of DEFAULT_SUBJECT_CATALOG) {
      await queryRunner.query(
        `INSERT INTO "subject" ("name", "description", "category", "grade_levels", "created_at", "updated_at")
         VALUES ($1, $2, $3, $4::jsonb, now(), now())
         ON CONFLICT ("name") DO UPDATE SET
           "category" = EXCLUDED."category",
           "grade_levels" = EXCLUDED."grade_levels",
           "updated_at" = now()`,
        [row.name, null, row.category, JSON.stringify(row.gradeLevels)],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "subject" DROP COLUMN IF EXISTS "grade_levels"`);
  }
}
