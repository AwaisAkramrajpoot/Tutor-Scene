import { MigrationInterface, QueryRunner, Table, TableColumn } from 'typeorm';

export class AddRatingToTestimonial1731500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableName = 'testimonials';
    const hasTable = await queryRunner.hasTable(tableName);

    if (!hasTable) {
      await queryRunner.createTable(
        new Table({
          name: tableName,
          columns: [
            {
              name: 'id',
              type: 'serial',
              isPrimary: true,
            },
            {
              name: 'testimonial',
              type: 'text',
              isNullable: false,
            },
            {
              name: 'testimonial_by',
              type: 'varchar',
              length: '255',
              isNullable: false,
            },
            {
              name: 'rating',
              type: 'int',
              isNullable: true,
            },
            {
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
            {
              name: 'updated_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
          ],
        }),
      );
      return;
    }

    const table = await queryRunner.getTable(tableName);
    const col = table?.findColumnByName('rating');
    if (!col) {
      await queryRunner.addColumn(
        tableName,
        new TableColumn({
          name: 'rating',
          type: 'int',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableName = 'testimonials';
    const hasTable = await queryRunner.hasTable(tableName);

    if (!hasTable) {
      return;
    }

    const table = await queryRunner.getTable(tableName);
    const ratingColumn = table?.findColumnByName('rating');

    if (ratingColumn) {
      await queryRunner.dropColumn(tableName, 'rating');
      return;
    }

    if (table?.columns.length === 6) {
      await queryRunner.dropTable(tableName);
    }
  }
}
