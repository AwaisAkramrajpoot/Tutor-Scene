import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLearnerAssessmentResponses1763200000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('learner_assessment_response');
    if (hasTable) return;

    await queryRunner.query(`
      CREATE TABLE "learner_assessment_response" (
        "id" SERIAL NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "user_id" integer NOT NULL,
        "learner_label" character varying(120) NOT NULL,
        "answers" jsonb NOT NULL DEFAULT '{}',
        "status" character varying(20) NOT NULL,
        CONSTRAINT "PK_learner_assessment_response" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_learner_assessment_user_learner" UNIQUE ("user_id", "learner_label"),
        CONSTRAINT "FK_learner_assessment_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "learner_assessment_response" CASCADE`,
    );
  }
}
