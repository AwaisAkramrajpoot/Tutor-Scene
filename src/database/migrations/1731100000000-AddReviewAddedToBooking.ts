import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddReviewAddedToBooking1731100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if the column already exists
    const table = await queryRunner.getTable('booking');
    const reviewAddedColumn = table?.findColumnByName('review_added');

    if (!reviewAddedColumn) {
      await queryRunner.addColumn(
        'booking',
        new TableColumn({
          name: 'review_added',
          type: 'boolean',
          default: false,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('booking', 'review_added');
  }
}
