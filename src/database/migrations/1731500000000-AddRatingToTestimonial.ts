import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddRatingToTestimonial1731500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('testimonials');
    const col = table?.findColumnByName('rating');
    if (!col) {
      await queryRunner.addColumn(
        'testimonials',
        new TableColumn({
          name: 'rating',
          type: 'int',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('testimonials', 'rating');
  }
}
