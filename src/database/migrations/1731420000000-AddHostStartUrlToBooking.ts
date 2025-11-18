import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddHostStartUrlToBooking1731420000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'booking',
      new TableColumn({
        name: 'host_start_url',
        type: 'varchar',
        length: '500',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('booking', 'host_start_url');
  }
}
