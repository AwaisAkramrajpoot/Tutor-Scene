import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVirtualInterviewResponses1761000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('virtual_interview_responses');
    if (hasTable) return;

    await queryRunner.query(`
      CREATE TABLE "virtual_interview_responses" (
        "id" SERIAL NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "user_id" integer NOT NULL,
        "responses" jsonb NOT NULL DEFAULT '{}',
        "completed" boolean NOT NULL DEFAULT false,
        "submitted_at" TIMESTAMP,
        CONSTRAINT "PK_virtual_interview_responses" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_virtual_interview_responses_user_id" UNIQUE ("user_id"),
        CONSTRAINT "FK_virtual_interview_responses_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "virtual_interview_responses" CASCADE`,
    );
  }
}

