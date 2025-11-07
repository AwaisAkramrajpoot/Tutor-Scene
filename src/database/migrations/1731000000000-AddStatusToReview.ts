import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddStatusToReview1731000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if the column already exists
    const table = await queryRunner.getTable('review');
    const statusColumn = table?.findColumnByName('status');

    if (!statusColumn) {
      await queryRunner.addColumn(
        'review',
        new TableColumn({
          name: 'status',
          type: 'enum',
          enum: ['pending', 'approved', 'rejected', 'flagged'],
          default: "'pending'",
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('review', 'status');
  }
}
