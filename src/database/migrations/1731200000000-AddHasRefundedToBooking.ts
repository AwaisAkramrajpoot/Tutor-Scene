import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddHasRefundedToBooking1731200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if the column already exists
    const table = await queryRunner.getTable('booking');
    const hasRefundedColumn = table?.findColumnByName('has_refunded');

    if (!hasRefundedColumn) {
      await queryRunner.addColumn(
        'booking',
        new TableColumn({
          name: 'has_refunded',
          type: 'boolean',
          default: false,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('booking', 'has_refunded');
  }
}
