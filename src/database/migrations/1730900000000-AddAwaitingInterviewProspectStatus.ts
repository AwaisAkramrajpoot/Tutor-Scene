import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAwaitingInterviewProspectStatus1730900000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TYPE "prospects_status_enum" ADD VALUE IF NOT EXISTS 'awaiting_interview' AFTER 'pending';
      EXCEPTION
        WHEN undefined_object THEN
          BEGIN
            ALTER TYPE "prospect_status_enum" ADD VALUE IF NOT EXISTS 'awaiting_interview' AFTER 'pending';
          EXCEPTION
            WHEN undefined_object THEN NULL;
          END;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: PostgreSQL doesn't support removing enum values directly
    // You would need to recreate the enum type if you want to remove a value
    // For now, we'll leave this empty as removing enum values is complex
    // and typically not needed in production
  }
}
