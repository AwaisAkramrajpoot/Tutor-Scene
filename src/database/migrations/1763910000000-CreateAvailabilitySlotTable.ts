import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAvailabilitySlotTable1763910000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('availability_slot');
    if (!hasTable) {
      await queryRunner.query(`
        CREATE TABLE "availability_slot" (
          "id" SERIAL NOT NULL,
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          "tutor_profile_id" integer NOT NULL,
          "start_time" TIMESTAMP NOT NULL,
          "end_time" TIMESTAMP NOT NULL,
          CONSTRAINT "PK_availability_slot" PRIMARY KEY ("id"),
          CONSTRAINT "FK_availability_slot_tutor_user"
            FOREIGN KEY ("tutor_profile_id") REFERENCES "user"("id") ON DELETE CASCADE
        );
      `);

      await queryRunner.query(`
        CREATE INDEX "IDX_availability_slot_tutor_profile_id"
        ON "availability_slot" ("tutor_profile_id");
      `);

      await queryRunner.query(`
        CREATE INDEX "IDX_availability_slot_start_time"
        ON "availability_slot" ("start_time");
      `);

      await queryRunner.query(`
        CREATE INDEX "IDX_availability_slot_tutor_time"
        ON "availability_slot" ("tutor_profile_id", "start_time", "end_time");
      `);
    } else {
      const hasStartTime = await queryRunner.hasColumn('availability_slot', 'start_time');
      const hasStartTimeCamel = await queryRunner.hasColumn('availability_slot', 'startTime');

      if (!hasStartTime && hasStartTimeCamel) {
        await queryRunner.query(`
          ALTER TABLE "availability_slot" RENAME COLUMN "startTime" TO "start_time";
        `);
      }
      if (!hasStartTime && !hasStartTimeCamel) {
        await queryRunner.query(`
          ALTER TABLE "availability_slot" ADD COLUMN "start_time" TIMESTAMP;
        `);
      }

      const hasEndTime = await queryRunner.hasColumn('availability_slot', 'end_time');
      const hasEndTimeCamel = await queryRunner.hasColumn('availability_slot', 'endTime');

      if (!hasEndTime && hasEndTimeCamel) {
        await queryRunner.query(`
          ALTER TABLE "availability_slot" RENAME COLUMN "endTime" TO "end_time";
        `);
      }
      if (!hasEndTime && !hasEndTimeCamel) {
        await queryRunner.query(`
          ALTER TABLE "availability_slot" ADD COLUMN "end_time" TIMESTAMP;
        `);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('availability_slot')) {
      await queryRunner.query(`DROP TABLE "availability_slot" CASCADE;`);
    }
  }
}
