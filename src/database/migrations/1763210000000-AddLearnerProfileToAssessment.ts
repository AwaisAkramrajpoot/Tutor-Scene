import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLearnerProfileToAssessment1763210000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = 'learner_assessment_response';
    if (!(await queryRunner.hasTable(table))) return;

    if (!(await queryRunner.hasColumn(table, 'learner_first_name'))) {
      await queryRunner.query(
        `ALTER TABLE "learner_assessment_response" ADD "learner_first_name" character varying(100)`,
      );
    }
    if (!(await queryRunner.hasColumn(table, 'grade_level'))) {
      await queryRunner.query(
        `ALTER TABLE "learner_assessment_response" ADD "grade_level" character varying(80)`,
      );
    }
    if (!(await queryRunner.hasColumn(table, 'gender'))) {
      await queryRunner.query(
        `ALTER TABLE "learner_assessment_response" ADD "gender" character varying(40)`,
      );
    }
    if (!(await queryRunner.hasColumn(table, 'relationship_to_learner'))) {
      await queryRunner.query(
        `ALTER TABLE "learner_assessment_response" ADD "relationship_to_learner" character varying(80)`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "learner_assessment_response" DROP COLUMN IF EXISTS "learner_first_name"`,
    );
    await queryRunner.query(
      `ALTER TABLE "learner_assessment_response" DROP COLUMN IF EXISTS "grade_level"`,
    );
    await queryRunner.query(
      `ALTER TABLE "learner_assessment_response" DROP COLUMN IF EXISTS "gender"`,
    );
    await queryRunner.query(
      `ALTER TABLE "learner_assessment_response" DROP COLUMN IF EXISTS "relationship_to_learner"`,
    );
  }
}
