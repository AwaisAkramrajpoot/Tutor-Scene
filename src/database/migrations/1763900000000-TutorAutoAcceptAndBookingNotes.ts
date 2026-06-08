import { MigrationInterface, QueryRunner } from 'typeorm';

export class TutorAutoAcceptAndBookingNotes1763900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasAutoAccept = await queryRunner.hasColumn('prospects', 'auto_accept_booking_requests');
    if (!hasAutoAccept) {
      await queryRunner.query(`
        ALTER TABLE "prospects"
        ADD COLUMN "auto_accept_booking_requests" boolean NOT NULL DEFAULT false;
      `);
    }

    const hasNotes = await queryRunner.hasColumn('booking', 'notes');
    if (!hasNotes) {
      await queryRunner.query(`
        ALTER TABLE "booking"
        ADD COLUMN "notes" text;
      `);
    }

    const hasReviewExpires = await queryRunner.hasColumn('booking', 'review_expires_at');
    if (!hasReviewExpires) {
      await queryRunner.query(`
        ALTER TABLE "booking"
        ADD COLUMN "review_expires_at" TIMESTAMP;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('booking', 'review_expires_at')) {
      await queryRunner.query(`ALTER TABLE "booking" DROP COLUMN "review_expires_at";`);
    }
    if (await queryRunner.hasColumn('booking', 'notes')) {
      await queryRunner.query(`ALTER TABLE "booking" DROP COLUMN "notes";`);
    }
    if (await queryRunner.hasColumn('prospects', 'auto_accept_booking_requests')) {
      await queryRunner.query(`ALTER TABLE "prospects" DROP COLUMN "auto_accept_booking_requests";`);
    }
  }
}
