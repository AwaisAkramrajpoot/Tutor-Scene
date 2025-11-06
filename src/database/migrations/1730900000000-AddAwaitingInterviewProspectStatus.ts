import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAwaitingInterviewProspectStatus1730900000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add 'awaiting_interview' to the prospect_status enum
    await queryRunner.query(`
      ALTER TYPE "prospect_status_enum" 
      ADD VALUE IF NOT EXISTS 'awaiting_interview' 
      AFTER 'pending';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: PostgreSQL doesn't support removing enum values directly
    // You would need to recreate the enum type if you want to remove a value
    // For now, we'll leave this empty as removing enum values is complex
    // and typically not needed in production
  }
}
