import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDiscountFieldsToBooking1731400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('booking');

    // Add discount_code column
    const discountCodeColumn = table?.findColumnByName('discount_code');
    if (!discountCodeColumn) {
      await queryRunner.addColumn(
        'booking',
        new TableColumn({
          name: 'discount_code',
          type: 'varchar',
          length: '50',
          isNullable: true,
        }),
      );
    }

    // Add discount_amount column
    const discountAmountColumn = table?.findColumnByName('discount_amount');
    if (!discountAmountColumn) {
      await queryRunner.addColumn(
        'booking',
        new TableColumn({
          name: 'discount_amount',
          type: 'decimal',
          precision: 10,
          scale: 2,
          isNullable: true,
        }),
      );
    }

    // Add final_price column
    const finalPriceColumn = table?.findColumnByName('final_price');
    if (!finalPriceColumn) {
      await queryRunner.addColumn(
        'booking',
        new TableColumn({
          name: 'final_price',
          type: 'decimal',
          precision: 10,
          scale: 2,
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('booking', 'discount_code');
    await queryRunner.dropColumn('booking', 'discount_amount');
    await queryRunner.dropColumn('booking', 'final_price');
  }
}
